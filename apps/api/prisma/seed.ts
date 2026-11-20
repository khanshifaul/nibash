import { PrismaClient, GasType, ParkingType, AvailabilityStatus, ModerationStatus, RoomTag, ListingType } from "./generated/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as bcrypt from "bcryptjs";

const writeUrl = process.env.DATABASE_URL;
if (!writeUrl) throw new Error("DATABASE_URL is required");
const adapter = new PrismaPg({ connectionString: writeUrl });
const prisma = new PrismaClient({ adapter });

function bdt(amount: number) {
  // amount in BDT major units -> minor units (paisa) if desired? existing data used values like 2800000 meaning 28,000 BDT? earlier: (rentAmount/100).toLocaleString()/mo shown as ৳28,000 etc.
  return amount * 100;
}

async function upsertImage(apartmentId: string, storageKey: string, url: string) {
  const existing = await prisma.apartmentImage.findFirst({ where: { apartmentId, storageKey } });
  const data = { url, roomTag: RoomTag.COVER, sortOrder: 0 };
  if (existing) return prisma.apartmentImage.update({ where: { id: existing.id }, data });
  return prisma.apartmentImage.create({ data: { apartmentId, storageKey, ...data } });
}

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  // Clean existing data (nibash app DB) for fresh realistic seed
  await prisma.apartmentImage.deleteMany();
  await prisma.inquiry.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.apartment.deleteMany();
  await prisma.floor.deleteMany();
  await prisma.buildingImage.deleteMany();
  await prisma.building.deleteMany();
  await prisma.refreshToken.deleteMany();
  // keep users? recreate demo users cleanly
  await prisma.user.deleteMany();

  const owner = await prisma.user.create({
    data: {
      name: "Demo Owner",
      email: "owner@example.com",
      phone: "+8801700000001",
      passwordHash,
      isEmailVerified: true,
    },
  });

  const owner2 = await prisma.user.create({
    data: {
      name: "Ayesha Rahman",
      email: "landlord@example.com",
      phone: "+8801811000002",
      passwordHash,
      isEmailVerified: true,
    },
  });

  const img = (seed: string) => `https://images.unsplash.com/${seed}?auto=format&fit=crop&w=1200&q=80`;

  // 1) Single-story house (rent, available, listed)
  const house = await prisma.building.create({
    data: {
      ownerId: owner.id,
      name: "Green View House",
      slug: "green-view-house",
      areaZone: "Bashundhara R/A",
      roadBlock: "Block D",
      addressLine: "House 12, Block D, Bashundhara R/A, Dhaka",
      contactPhone: "+8801700000011",
      lat: 23.8155,
      lng: 90.4262,
      totalFloors: 1,
      hasParking: true,
      parkingType: ParkingType.CAR,
      hasGenerator: false,
      hasSecurityGuard: false,
      hasCctv: true,
      hasRooftop: true,
      hasSubmersiblePump: true,
      moderationStatus: ModerationStatus.APPROVED,
      publishedAt: new Date(),
      isFeatured: false,
    },
  });
  const houseFloor = await prisma.floor.create({ data: { buildingId: house.id, floorNumber: 0 } });
  const houseApt = await prisma.apartment.create({
    data: {
      buildingId: house.id,
      floorId: houseFloor.id,
      unitLabel: "Whole House",
      listingType: ListingType.RENT,
      sizeSqft: 1800,
      bedrooms: 3,
      bathrooms: 3,
      diningRooms: 1,
      drawingRooms: 1,
      kitchens: 1,
      verandas: 2,
      gasType: GasType.LINE,
      rentAmount: bdt(45000),
      serviceCharge: bdt(2000),
      securityDepositAmount: bdt(90000),
      depositMonths: 2,
      availabilityStatus: AvailabilityStatus.AVAILABLE,
      publishedAt: new Date(),
      preferredTenantTypes: ["Family"],
    },
  });
  await upsertImage(houseApt.id, `seed/${houseApt.id}/cover.jpg`, img("photo-1564013799919-ab600027ffc6"));

  // 2) Duplex house (for sale, available, listed) - modeled as one unit on level 1 spanning two levels
  const duplex = await prisma.building.create({
    data: {
      ownerId: owner2.id,
      name: "Lake Corner Duplex",
      slug: "lake-corner-duplex",
      areaZone: "Uttara Sector 12",
      roadBlock: "Road 18",
      addressLine: "House 7, Road 18, Sector 12, Uttara, Dhaka",
      contactPhone: "+8801811000012",
      lat: 23.8745,
      lng: 90.3862,
      totalFloors: 2,
      hasParking: true,
      parkingType: ParkingType.CAR_AND_BIKE,
      hasGenerator: true,
      generatorScope: "Full house",
      hasSecurityGuard: false,
      hasCctv: true,
      hasRooftop: true,
      hasSubmersiblePump: true,
      moderationStatus: ModerationStatus.APPROVED,
      publishedAt: new Date(),
      isFeatured: true,
    },
  });
  const duplexFloor = await prisma.floor.create({ data: { buildingId: duplex.id, floorNumber: 1 } });
  const duplexApt = await prisma.apartment.create({
    data: {
      buildingId: duplex.id,
      floorId: duplexFloor.id,
      unitLabel: "Duplex (2 levels)",
      listingType: ListingType.SALE,
      sizeSqft: 2400,
      bedrooms: 4,
      bathrooms: 4,
      diningRooms: 1,
      drawingRooms: 1,
      kitchens: 1,
      verandas: 3,
      gasType: GasType.LINE,
      rentAmount: 0,
      salePrice: bdt(18500000),
      serviceCharge: 0,
      securityDepositAmount: 0,
      availabilityStatus: AvailabilityStatus.AVAILABLE,
      publishedAt: new Date(),
      preferredTenantTypes: ["Family"],
    },
  });
  await upsertImage(duplexApt.id, `seed/${duplexApt.id}/cover.jpg`, img("photo-1600596542815-ffad4c1539a9"));

  // 3) 10-floor building with 25 units: floors 1-5 have 2 units (10), floors 6-10 have 3 units (15)
  // Mix: rent/sale, available/rented/sold/coming soon/maintenance, some unlisted
  const tower = await prisma.building.create({
    data: {
      ownerId: owner.id,
      name: "Shapla Residency Tower",
      slug: "shapla-residency-tower",
      areaZone: "Dhanmondi",
      roadBlock: "Road 27",
      addressLine: "Plot 8, Road 27, Dhanmondi, Dhaka",
      contactPhone: "+8801700000025",
      lat: 23.7461,
      lng: 90.3742,
      totalFloors: 10,
      hasElevator: true,
      elevatorCount: 2,
      hasParking: true,
      parkingType: ParkingType.CAR_AND_BIKE,
      hasGenerator: true,
      generatorScope: "Full building",
      hasSecurityGuard: true,
      hasCctv: true,
      hasIntercom: true,
      hasRooftop: true,
      hasSubmersiblePump: true,
      moderationStatus: ModerationStatus.APPROVED,
      publishedAt: new Date(),
      isFeatured: true,
    },
  });

  const towerImages = [
    "photo-1502672260266-1c1ef2d93688",
    "photo-1560448204-e02f11c3d0e2",
    "photo-1522708323590-d24dbb6b0267",
    "photo-1493809842364-78817add7ffb",
    "photo-1484154218962-a197022b5858",
    "photo-1505693416388-ac5ce068fe85",
    "photo-1493663284031-b7e3aefcae8e",
    "photo-1512918728675-ed5a9ecdebfd",
  ];

  let towerUnitCount = 0;
  for (let floorNum = 1; floorNum <= 10; floorNum++) {
    const floor = await prisma.floor.create({ data: { buildingId: tower.id, floorNumber: floorNum } });
    const unitsOnFloor = floorNum <= 5 ? 2 : 3; // 5*2 + 5*3 = 25
    for (let i = 0; i < unitsOnFloor; i++) {
      towerUnitCount++;
      const suffix = String.fromCharCode(65 + i); // A, B, C
      const unitLabel = `${floorNum}${suffix}`;

      // Real-life variety by index
      let listingType = ListingType.RENT;
      let availabilityStatus = AvailabilityStatus.AVAILABLE;
      let publishedAt: Date | null = new Date();
      let rentAmount = bdt(22000 + floorNum * 1500 + i * 2000);
      let salePrice: number | null = null;
      let serviceCharge = bdt(1500 + floorNum * 100);
      let deposit = bdt((22000 + floorNum * 1500 + i * 2000) * 2);

      if (towerUnitCount === 3) { // for sale, available
        listingType = ListingType.SALE; availabilityStatus = AvailabilityStatus.AVAILABLE;
        rentAmount = 0; salePrice = bdt(9500000 + floorNum * 250000); serviceCharge = 0; deposit = 0;
      } else if (towerUnitCount === 5) { // already rented, unlisted
        availabilityStatus = AvailabilityStatus.RENTED; publishedAt = null;
      } else if (towerUnitCount === 7) { // sold, unlisted
        listingType = ListingType.SALE; availabilityStatus = AvailabilityStatus.SOLD; publishedAt = null;
        rentAmount = 0; salePrice = bdt(12000000); serviceCharge = 0; deposit = 0;
      } else if (towerUnitCount === 9) { // coming soon, listed
        availabilityStatus = AvailabilityStatus.COMING_SOON; publishedAt = new Date();
      } else if (towerUnitCount === 11) { // maintenance, unlisted
        availabilityStatus = AvailabilityStatus.MAINTENANCE; publishedAt = null;
      } else if (towerUnitCount === 14) { // for sale, available, listed
        listingType = ListingType.SALE; availabilityStatus = AvailabilityStatus.AVAILABLE;
        rentAmount = 0; salePrice = bdt(11000000); serviceCharge = 0; deposit = 0;
      } else if (towerUnitCount === 18) { // rented but owner kept listed? better unlisted for rented realism
        availabilityStatus = AvailabilityStatus.RENTED; publishedAt = null;
      } else if (towerUnitCount === 21) { // unlisted by choice though available
        availabilityStatus = AvailabilityStatus.AVAILABLE; publishedAt = null;
      } else if (towerUnitCount === 24) { // sold, unlisted
        listingType = ListingType.SALE; availabilityStatus = AvailabilityStatus.SOLD; publishedAt = null;
        rentAmount = 0; salePrice = bdt(13500000); serviceCharge = 0; deposit = 0;
      }

      const apt = await prisma.apartment.create({
        data: {
          buildingId: tower.id,
          floorId: floor.id,
          unitLabel,
          listingType,
          facing: ["South", "East", "West", "North"][i % 4],
          sizeSqft: 900 + i * 150 + (floorNum % 3) * 80,
          bedrooms: 2 + (i % 2),
          bathrooms: 2 + (i % 2),
          diningRooms: 1,
          drawingRooms: 1,
          kitchens: 1,
          verandas: 1 + (i % 2),
          gasType: GasType.LINE,
          rentAmount,
          salePrice,
          serviceCharge,
          securityDepositAmount: deposit,
          depositMonths: listingType === ListingType.RENT ? 2 : null,
          availabilityStatus,
          publishedAt,
          preferredTenantTypes: listingType === ListingType.RENT ? ["Family", "Bachelor"] : ["Family"],
        },
      });
      await upsertImage(apt.id, `seed/${apt.id}/cover.jpg`, img(towerImages[towerUnitCount % towerImages.length]));
    }
  }

  // 4) Additional mixed building (rent examples incl. coming soon listed)
  const mirpur = await prisma.building.create({
    data: {
      ownerId: owner2.id,
      name: "Mirpur Garden View",
      slug: "mirpur-garden-view",
      areaZone: "Mirpur DOHS",
      roadBlock: "Avenue 4",
      addressLine: "House 21, Avenue 4, Mirpur DOHS, Dhaka",
      contactPhone: "+8801811000030",
      lat: 23.8361,
      lng: 90.3654,
      totalFloors: 6,
      hasElevator: true,
      elevatorCount: 1,
      hasParking: true,
      parkingType: ParkingType.BIKE,
      hasGenerator: true,
      generatorScope: "Common areas",
      hasSecurityGuard: true,
      hasCctv: false,
      hasRooftop: true,
      hasSubmersiblePump: true,
      moderationStatus: ModerationStatus.APPROVED,
      publishedAt: new Date(),
      isFeatured: false,
    },
  });
  const m3 = await prisma.floor.create({ data: { buildingId: mirpur.id, floorNumber: 3 } });
  const m5 = await prisma.floor.create({ data: { buildingId: mirpur.id, floorNumber: 5 } });
  const m3a = await prisma.apartment.create({
    data: {
      buildingId: mirpur.id, floorId: m3.id, unitLabel: "3A", listingType: ListingType.RENT,
      sizeSqft: 1100, bedrooms: 3, bathrooms: 2, verandas: 2, diningRooms: 1, drawingRooms: 0, kitchens: 1,
      gasType: GasType.LINE, rentAmount: bdt(24000), serviceCharge: bdt(2000), securityDepositAmount: bdt(48000), depositMonths: 2,
      availabilityStatus: AvailabilityStatus.AVAILABLE, publishedAt: new Date(), preferredTenantTypes: ["Family"],
    },
  });
  await upsertImage(m3a.id, `seed/${m3a.id}/cover.jpg`, img("photo-1560185007-cde436f6a4d0"));
  const m5b = await prisma.apartment.create({
    data: {
      buildingId: mirpur.id, floorId: m5.id, unitLabel: "5B", listingType: ListingType.RENT,
      sizeSqft: 850, bedrooms: 2, bathrooms: 1, verandas: 1, diningRooms: 1, drawingRooms: 0, kitchens: 1,
      gasType: GasType.CYLINDER, rentAmount: bdt(18000), serviceCharge: bdt(1500), securityDepositAmount: bdt(36000), depositMonths: 2,
      availabilityStatus: AvailabilityStatus.COMING_SOON, publishedAt: new Date(), availableFrom: new Date(Date.now() + 21 * 24 * 3600 * 1000),
      preferredTenantTypes: ["Small Family", "Bachelor"],
    },
  });
  await upsertImage(m5b.id, `seed/${m5b.id}/cover.jpg`, img("photo-1501183638710-841dd1904471"));

  console.log("Seed complete.");
  console.log("- Users: owner@example.com / password123, landlord@example.com / password123");
  console.log("- Buildings: Green View House (single-story, 1 unit rent), Lake Corner Duplex (duplex, 1 unit for sale), Shapla Residency Tower (10 floors, 25 units: floors 1-5 x2, floors 6-10 x3, mixed rent/sale/available/rented/sold/coming-soon/maintenance/listed/unlisted), Mirpur Garden View (rent examples)");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
