import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { getISTDate } from '../common/ist-time';
import { PrismaService } from '../prisma/prisma.service';

import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { SyncAttendanceDto } from './dto/sync-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { SyncLocationDto } from "./dto/sync-location.dto";
@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  // =========================================================
  // CREATE - NORMAL ONLINE PUNCH IN
  // =========================================================
  async create(createAttendanceDto: CreateAttendanceDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: createAttendanceDto.userId,
      },
    });

    if (!user) {
      throw new NotFoundException(
        `User with ID ${createAttendanceDto.userId} not found`,
      );
    }

    return this.prisma.attendance.create({
      data: {
        userId: createAttendanceDto.userId,
        photoUrl: createAttendanceDto.photoUrl,
        latitude: createAttendanceDto.latitude,
        longitude: createAttendanceDto.longitude,

        // Backend generates IST punch-in time
        inPunch: getISTDate(),
      },

      include: {
        user: true,
      },
    });
  }

  // =========================================================
  // READ ALL
  // =========================================================
  async findAll() {
    return this.prisma.attendance.findMany({
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // =========================================================
  // READ ONE
  // =========================================================
  async findOne(id: number) {
    const attendance = await this.prisma.attendance.findUnique({
      where: {
        id,
      },
      include: {
        user: true,
      },
    });

    if (!attendance) {
      throw new NotFoundException(`Attendance with ID ${id} not found`);
    }

    return attendance;
  }

  // =========================================================
  // READ BY USER
  // =========================================================
  async findByUser(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return this.prisma.attendance.findMany({
      where: {
        userId,
      },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // =========================================================
  // UPDATE - NORMAL ONLINE PUNCH OUT
  // =========================================================
  async update(id: number, updateAttendanceDto: UpdateAttendanceDto) {
    await this.findOne(id);

    if (updateAttendanceDto.userId !== undefined) {
      const user = await this.prisma.user.findUnique({
        where: {
          id: updateAttendanceDto.userId,
        },
      });

      if (!user) {
        throw new NotFoundException(
          `User with ID ${updateAttendanceDto.userId} not found`,
        );
      }
    }

    return this.prisma.attendance.update({
      where: {
        id,
      },

      data: {
        userId: updateAttendanceDto.userId,
        photoUrl: updateAttendanceDto.photoUrl,
        latitude: updateAttendanceDto.latitude,
        longitude: updateAttendanceDto.longitude,

        // Backend generates IST punch-out time
        outPunch: getISTDate(),
      },

      include: {
        user: true,
      },
    });
  }

  // =========================================================
  // DELETE
  // =========================================================
  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.attendance.delete({
      where: {
        id,
      },
    });
  }

  // =========================================================
  // OFFLINE SYNC
  // POST /attendance/sync
  // =========================================================
  async syncAttendance(dto: SyncAttendanceDto) {
    // -------------------------------------------------------
    // PUNCH IN
    // -------------------------------------------------------
    if (dto.action === 'PUNCH_IN') {
      // Check if this event was already synchronized
      const existing = await this.prisma.attendance.findFirst({
        where: {
          inClientEventId: dto.clientEventId,
        },
        include: {
          user: true,
        },
      });

      if (existing) {
        return {
          success: true,
          duplicated: true,
          attendance: existing,
        };
      }

      // Make sure user exists
      const user = await this.prisma.user.findUnique({
        where: {
          id: dto.userId,
        },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${dto.userId} not found`);
      }

      // Convert the mobile's stored wall-clock IST
      // into a Date value suitable for timestamp without time zone.
      const punchTime = this.wallClockToDate(dto.punchTime);

      const attendance = await this.prisma.attendance.create({
        data: {
          userId: dto.userId,
          latitude: dto.latitude,
          longitude: dto.longitude,

          // Original time when employee actually punched
          inPunch: punchTime,

          // Unique mobile event ID
          inClientEventId: dto.clientEventId,
        },

        include: {
          user: true,
        },
      });

      return {
        success: true,
        duplicated: false,
        attendance,
      };
    }

    // -------------------------------------------------------
    // PUNCH OUT
    // -------------------------------------------------------

    if (!dto.referenceEventId) {
      throw new ConflictException(
        'referenceEventId is required for Punch Out.',
      );
    }

    // Check whether this Punch Out was already synchronized
    const existingOut = await this.prisma.attendance.findFirst({
      where: {
        outClientEventId: dto.clientEventId,
      },
      include: {
        user: true,
      },
    });

    if (existingOut) {
      return {
        success: true,
        duplicated: true,
        attendance: existingOut,
      };
    }

    // Find the server attendance record created
    // from the corresponding Punch In event.
    const attendance = await this.prisma.attendance.findFirst({
      where: {
        inClientEventId: dto.referenceEventId,
        userId: dto.userId,
      },
      include: {
        user: true,
      },
    });

    if (!attendance) {
      throw new NotFoundException(
        'Matching Punch In attendance was not found.',
      );
    }

    // Prevent two different Punch Outs for the same
    // attendance record.
    if (attendance.outPunch) {
      throw new ConflictException(
        'This attendance record already has a Punch Out.',
      );
    }

    const punchTime = this.wallClockToDate(dto.punchTime);

    const updated = await this.prisma.attendance.update({
      where: {
        id: attendance.id,
      },

      data: {
        outPunch: punchTime,
        outClientEventId: dto.clientEventId,

        // Store the latest location received with Punch Out
        latitude: dto.latitude,
        longitude: dto.longitude,
      },

      include: {
        user: true,
      },
    });

    return {
      success: true,
      duplicated: false,
      attendance: updated,
    };
  }

  // =========================================================
  // CONVERT WALL-CLOCK IST STRING
  // TO DATE FOR PostgreSQL timestamp WITHOUT TIME ZONE
  // =========================================================
  private wallClockToDate(value: string): Date {
    return new Date(value.replace(' ', 'T') + 'Z');
  }

  async syncLocation(dto: SyncLocationDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: dto.userId,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${dto.userId} not found.`);
    }

    const existing = await this.prisma.attendanceLocation.findUnique({
      where: {
        clientLocationId: dto.clientLocationId,
      },
    });

    if (existing) {
      return {
        success: true,
        duplicated: true,
        location: existing,
      };
    }

    const location = await this.prisma.attendanceLocation.create({
      data: {
        clientLocationId: dto.clientLocationId,
        sessionEventId: dto.sessionEventId,
        userId: dto.userId,
        latitude: dto.latitude,
        longitude: dto.longitude,
        capturedAt: this.wallClockToDate(dto.capturedAt),
      },
    });

    return {
      success: true,
      duplicated: false,
      location,
    };
  }
}
