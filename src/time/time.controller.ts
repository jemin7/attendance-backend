import { Controller, Get } from '@nestjs/common';

function getISTTimeString(): string {
  const now = new Date();

  const parts = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);

  const values: Record<string, string> = {};

  for (const part of parts) {
    values[part.type] = part.value;
  }

  const milliseconds = String(
    now.getMilliseconds(),
  ).padStart(3, '0');

  return (
    values.year +
    '-' +
    values.month +
    '-' +
    values.day +
    ' ' +
    values.hour +
    ':' +
    values.minute +
    ':' +
    values.second +
    '.' +
    milliseconds
  );
}

@Controller('time')
export class TimeController {
  @Get()
  getTime() {
    return {
      serverUtcMs: Date.now(),
      serverIST: getISTTimeString(),
    };
  }
}