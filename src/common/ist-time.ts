export function getISTDate(): Date {
  const now = new Date();

  // Add 5 hours 30 minutes to UTC to get IST wall-clock time.
  const istTime = new Date(
    now.getTime() + (5 * 60 + 30) * 60 * 1000,
  );

  return istTime;
}