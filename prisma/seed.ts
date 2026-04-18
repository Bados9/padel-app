import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient({ log: ["error"] });

async function main() {
  console.log("Seeding…");

  const adminEmail = "admin@padel.local";
  const adminPassword = "admin123";
  const userEmail = "hrac@padel.local";
  const userPassword = "hrac123";

  const [admin, user] = await Promise.all([
    db.user.upsert({
      where: { email: adminEmail },
      update: {},
      create: {
        email: adminEmail,
        name: "Admin klubu",
        role: "ADMIN",
        level: "PRO",
        passwordHash: await bcrypt.hash(adminPassword, 10),
      },
    }),
    db.user.upsert({
      where: { email: userEmail },
      update: {},
      create: {
        email: userEmail,
        name: "Testovací hráč",
        role: "USER",
        level: "INTERMEDIATE",
        passwordHash: await bcrypt.hash(userPassword, 10),
      },
    }),
  ]);

  const courts = [
    {
      name: "Kurt 1 – Central",
      description: "Hlavní krytý kurt s prosklenými stěnami.",
      surface: "ARTIFICIAL_GRASS" as const,
      indoor: true,
    },
    {
      name: "Kurt 2 – Club",
      description: "Klubový kurt s panoramatickým výhledem.",
      surface: "ARTIFICIAL_GRASS" as const,
      indoor: true,
    },
  ];

  for (const c of courts) {
    const court = await db.court.upsert({
      where: { name: c.name },
      update: {},
      create: c,
    });

    // Otevírací doba Po–Ne 08:00–22:00
    for (let day = 0; day < 7; day++) {
      await db.openingHours.upsert({
        where: {
          courtId_dayOfWeek: { courtId: court.id, dayOfWeek: day },
        },
        update: {},
        create: {
          courtId: court.id,
          dayOfWeek: day,
          startTime: "08:00",
          endTime: "22:00",
        },
      });
    }
  }

  console.log("Hotovo.");
  console.log(`  admin: ${admin.email} / ${adminPassword}`);
  console.log(`  user:  ${user.email} / ${userPassword}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
