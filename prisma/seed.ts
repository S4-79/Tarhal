// Load Prisma at runtime so this seed file does not require TypeScript to
// resolve the generated client declarations during editor type-checking.
declare const require: (moduleName: string) => any;
declare const process: { exit: (code?: number) => never };
const { PrismaClient } = require('@prisma/client');

const SeatStatus = {
  BOOKED: 'BOOKED',
  AVAILABLE: 'AVAILABLE',
} as const;

const PaymentStatus = {
  PAID: 'PAID',
} as const;

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing existing data...');
  // Clear in reverse order of dependencies to avoid foreign key constraints
  await prisma.bookingTraveler.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.seat.deleteMany();
  await prisma.flight.deleteMany();
  await prisma.user.deleteMany();
  await prisma.hotel.deleteMany();
  await prisma.car.deleteMany();

  console.log('Seeding new test data...');

  // 1. Create a User (Now includes phoneNumber)
  const user = await prisma.user.create({
    data: {
      name: 'Ahmad Al-Fahad',
      email: 'ahmad@example.com',
      phoneNumber: '+966500000000',
      password: 'hashed_password_123',
      role: 'traveler',
    },
  });

  // 2. Create a Flight
  const flight = await prisma.flight.create({
    data: {
      flightNumber: 'SV105',
      from: 'DMM',
      to: 'RUH',
      departureTime: new Date('2026-10-15T08:00:00Z'),
      arrivalTime: new Date('2026-10-15T09:15:00Z'),
      basePrice: 450.0,
    },
  });

  // 3. Create Seats for the Flight
  const seat1 = await prisma.seat.create({
    data: {
      flightId: flight.id,
      seatCode: '1A',
      ticketClass: 'Business',
      priceMultiplier: 2.5,
      status: SeatStatus.BOOKED, 
    },
  });

  const seat2 = await prisma.seat.create({
    data: {
      flightId: flight.id,
      seatCode: '1B',
      ticketClass: 'Business',
      priceMultiplier: 2.5,
      status: SeatStatus.AVAILABLE,
    },
  });

  // 4. Create a Booking with a nested Traveler
  const booking = await prisma.booking.create({
    data: {
      userId: user.id,
      flightId: flight.id,
      basePrice: 450.0,
      luggageFee: 100.0,
      discount: 0.0,
      totalPrice: 1225.0, 
      paymentStatus: PaymentStatus.PAID,
      travelers: {
        create: [
          {
            seatId: seat1.id,
            fullName: 'Ahmad Al-Fahad',
            passportNumber: 'N12345678',
            dateOfBirth: new Date('1992-05-14T00:00:00Z'),
          },
        ],
      },
    },
  });

  // 5. Seed MVP Catalog (Hotels & Cars)
  await prisma.hotel.create({
    data: {
      name: 'Horizon Towers',
      city: 'Riyadh',
      pricePerNight: 850.0,
      rating: 4.8,
      roomType: 'Executive Suite',
    },
  });

  await prisma.car.create({
    data: {
      category: 'Mid-size SUV',
      pricePerDay: 220.0,
      insuranceOption: true,
    },
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });