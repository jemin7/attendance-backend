import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // CREATE
  async create(createUserDto: CreateUserDto) {
    try {
      return await this.prisma.user.create({
        data: {
          username: createUserDto.username,
          passwordHash: createUserDto.passwordHash,
          role: createUserDto.role ?? 'EMPLOYEE',
          firstName: createUserDto.firstName,
          lastName: createUserDto.lastName,
          email: createUserDto.email,
          phone: createUserDto.phone,
        },
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Username or email already exists',
        );
      }

      throw error;
    }
  }

  // READ ALL
  async findAll() {
    return this.prisma.user.findMany({
      include: {
        attendances: true,
      },
      orderBy: {
        id: 'asc',
      },
    });
  }

  // READ ONE
  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
      include: {
        attendances: true,
      },
    });

    if (!user) {
      throw new NotFoundException(
        `User with ID ${id} not found`,
      );
    }

    return user;
  }

  // UPDATE
  async update(
    id: number,
    updateUserDto: UpdateUserDto,
  ) {
    await this.findOne(id);

    try {
      return await this.prisma.user.update({
        where: {
          id,
        },
        data: updateUserDto,
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Username or email already exists',
        );
      }

      throw error;
    }
  }

  // DELETE
  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.user.delete({
      where: {
        id,
      },
    });
  }
}