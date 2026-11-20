import { PrismaClient, GasType, ParkingType, AvailabilityStatus, ModerationStatus, RoomTag } from "./generated/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as bcrypt from "bcryptjs";

const writeUrl = process.env.DATABASE_URL;
if (!writeUrl) throw new Error("DATABASE_URL is required");
const adapter = new PrismaPg({ connectionString: writeUrl });
const prisma = new PrismaClient({ adapter });

function upsertBuilding(data: any) {
  return prisma.building.upsert({
    where: { slug: data.slug },
    update: {
      name: data.name,
      areaZone: data.areaZone,
      roadBlock: data.roadBlock,
      addressLine: data.addressLine,
      contactPhone: data.contactPhone,
      lat: data.lat,
      lng: data.lng,
      totalFloors: data.totalFloors,
      hasElevator: data.hasElevator,
      elevatorCount: data.elevatorCount,
      hasParking: data.hasParking,
      parkingType: data.parkingType,
      hasGenerator: data.hasGenerator,
      generatorScope: data.generatorScope,
      hasSecurityGuard: data.hasSecurityGuard,
      hasCctv: data.hasCctv,
      hasIntercom: data.hasIntercom,
      hasRooftop: data.hasRooftop,
      hasSubmersiblePump: data.hasSubmersiblePump,
      moderationStatus: data.moderationStatus,
      publishedAt: data.publishedAt,
      isFeatured: data.isFeatured ?? false,
    },
    create: data,
  });
}

function upsertFloor(buildingId: string, floorNumber: number) {
  return prisma.floor.upsert({
    where: { buildingId_floorNumber: { buildingId, floorNumber } },
    update: {},
    create: { buildingId, floorNumber },
  });
}

function upsertApartment(floorId: string, buildingId: string, unitLabel: string, data: any) {
  return prisma.apartment.upsert({
    where: { floorId_unitLabel: { floorId, unitLabel } },
    update: data,
    create: { buildingId, floorId, unitLabel, ...data },
  });
}

async function upsertApartmentImage(apartmentId: string, storageKey: string, data: any) {
  const existing = await prisma.apartmentImage.findFirst({ where: { apartmentId, storageKey } });
  if (existing) {
    return prisma.apartmentImage.update({ where: { id: existing.id }, data });
  }
  return prisma.apartmentImage.create({ data: { apartmentId, storageKey, ...data } });
}

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  const owner = await prisma.user.upsert({
    where: { email: "owner@example.com" },
    update: { name: "Demo Owner", phone: "+8801700000000", isEmailVerified: true },
    create: {
      name: "Demo Owner",
      email: "owner@example.com",
      phone: "+8801700000000",
      passwordHash,
      isEmailVerified: true,
    },
  });

  const owner2 = await prisma.user.upsert({
    where: { email: "landlord@example.com" },
    update: { name: "Ayesha Rahman", phone: "+8801811000000", isEmailVerified: true },
    create: {
      name: "Ayesha Rahman",
      email: "landlord@example.com",
      phone: "+8801811000000",
      passwordHash,
      isEmailVerified: true,
    },
  });

  const buildingsData = [
    {
      ownerId: owner.id,
      name: "Rose Garden Heights",
      slug: "rose-garden-heights",
      areaZone: "Dhanmondi",
      roadBlock: "Road 7A",
      addressLine: "House 14, Road 7A, Dhanmondi, Dhaka",
      contactPhone: "+8801700000000",
      lat: 23.7465,
      lng: 90.3760,
      totalFloors: 8,
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
    {
      ownerId: owner.id,
      name: "Lakeview Residency",
      slug: "lakeview-residency",
      areaZone: "Gulshan 2",
      roadBlock: "Road 45",
      addressLine: "Plot 12, Road 45, Gulshan 2, Dhaka",
      contactPhone: "+8801700000001",
      lat: 23.7925,
      lng: 90.4078,
      totalFloors: 10,
      hasElevator: true,
      elevatorCount: 2,
      hasParking: true,
      parkingType: ParkingType.CAR,
      hasGenerator: true,
      generatorScope: "Common areas & flats",
      hasSecurityGuard: true,
      hasCctv: true,
      hasIntercom: true,
      hasRooftop: true,
      hasSubmersiblePump: true,
      moderationStatus: ModerationStatus.APPROVED,
      publishedAt: new Date(),
      isFeatured: true,
    },
    {
      ownerId: owner2.id,
      name: "Banani Orchid Tower",
      slug: "banani-orchid-tower",
      areaZone: "Banani",
      roadBlock: "Road 11",
      addressLine: "House 55, Road 11, Banani, Dhaka",
      contactPhone: "+8801811000000",
      lat: 23.7937,
      lng: 90.4066,
      totalFloors: 7,
      hasElevator: true,
      elevatorCount: 1,
      hasParking: true,
      parkingType: ParkingType.CAR_AND_BIKE,
      hasGenerator: true,
      generatorScope: "Full backup",
      hasSecurityGuard: true,
      hasCctv: true,
      hasIntercom: false,
      hasRooftop: true,
      hasSubmersiblePump: true,
      moderationStatus: ModerationStatus.APPROVED,
      publishedAt: new Date(),
      isFeatured: false,
    },
    {
      ownerId: owner2.id,
      name: "Uttara Skyline Homes",
      slug: "uttara-skyline-homes",
      areaZone: "Uttara Sector 7",
      roadBlock: "Road 3",
      addressLine: "House 8, Road 3, Sector 7, Uttara, Dhaka",
      contactPhone: "+8801811000001",
      lat: 23.8759,
      lng: 90.3795,
      totalFloors: 9,
      hasElevator: true,
      elevatorCount: 2,
      hasParking: true,
      parkingType: ParkingType.CAR_AND_BIKE,
      hasGenerator: true,
      generatorScope: "Common & emergency",
      hasSecurityGuard: true,
      hasCctv: true,
      hasIntercom: true,
      hasRooftop: false,
      hasSubmersiblePump: true,
      moderationStatus: ModerationStatus.APPROVED,
      publishedAt: new Date(),
      isFeatured: false,
    },
    {
      ownerId: owner.id,
      name: "Mirpur Garden View",
      slug: "mirpur-garden-view",
      areaZone: "Mirpur DOHS",
      roadBlock: "Avenue 4",
      addressLine: "House 21, Avenue 4, Mirpur DOHS, Dhaka",
      contactPhone: "+8801700000002",
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
      hasIntercom: false,
      hasRooftop: true,
      hasSubmersiblePump: true,
      moderationStatus: ModerationStatus.APPROVED,
      publishedAt: new Date(),
      isFeatured: false,
    },
    {
      ownerId: owner2.id,
      name: "Bashundhara Palm Court",
      slug: "bashundhara-palm-court",
      areaZone: "Bashundhara R/A",
      roadBlock: "Block C",
      addressLine: "Plot 302, Block C, Bashundhara R/A, Dhaka",
      contactPhone: "+8801811000002",
      lat: 23.8151,
      lng: 90.4255,
      totalFloors: 12,
      hasElevator: true,
      elevatorCount: 3,
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
  ];

  const buildings: Record<string, any> = {};
  for (const b of buildingsData) {
    buildings[b.slug] = await upsertBuilding(b);
  }

  const aptDefs = [
    // Rose Garden Heights
    { b: "rose-garden-heights", floor: 4, unit: "4B", data: { facing: "South-East", sizeSqft: 1450, bedrooms: 3, attachedBathrooms: 2, bathrooms: 3, diningRooms: 1, drawingRooms: 1, kitchens: 1, verandas: 2, gasType: GasType.LINE, rentAmount: 2800000, serviceCharge: 350000, securityDepositAmount: 5600000, depositMonths: 2, availabilityStatus: AvailabilityStatus.AVAILABLE, publishedAt: new Date(), preferredTenantTypes: ["Family"] }, img: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80" },
    { b: "rose-garden-heights", floor: 6, unit: "6A", data: { facing: "South", sizeSqft: 1650, bedrooms: 3, attachedBathrooms: 3, bathrooms: 3, diningRooms: 1, drawingRooms: 1, kitchens: 1, verandas: 3, gasType: GasType.LINE, rentAmount: 3500000, serviceCharge: 400000, securityDepositAmount: 7000000, depositMonths: 2, availabilityStatus: AvailabilityStatus.AVAILABLE, publishedAt: new Date(), preferredTenantTypes: ["Family", "Executive"] }, img: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80" },
    { b: "rose-garden-heights", floor: 2, unit: "2C", data: { facing: "North", sizeSqft: 980, bedrooms: 2, attachedBathrooms: 1, bathrooms: 2, diningRooms: 1, drawingRooms: 0, kitchens: 1, verandas: 1, gasType: GasType.LINE, rentAmount: 2200000, serviceCharge: 250000, securityDepositAmount: 4400000, depositMonths: 2, availabilityStatus: AvailabilityStatus.COMING_SOON, publishedAt: new Date(), preferredTenantTypes: ["Small Family", "Bachelor"] }, img: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80" },

    // Lakeview Residency
    { b: "lakeview-residency", floor: 8, unit: "8A", data: { facing: "Lake-facing", sizeSqft: 2100, bedrooms: 4, attachedBathrooms: 3, bathrooms: 4, diningRooms: 1, drawingRooms: 1, kitchens: 1, verandas: 3, gasType: GasType.LINE, rentAmount: 6500000, serviceCharge: 600000, securityDepositAmount: 13000000, depositMonths: 2, availabilityStatus: AvailabilityStatus.AVAILABLE, publishedAt: new Date(), preferredTenantTypes: ["Family", "Expat"] }, img: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200&q=80" },
    { b: "lakeview-residency", floor: 5, unit: "5B", data: { facing: "East", sizeSqft: 1550, bedrooms: 3, attachedBathrooms: 2, bathrooms: 3, diningRooms: 1, drawingRooms: 1, kitchens: 1, verandas: 2, gasType: GasType.LINE, rentAmount: 4800000, serviceCharge: 450000, securityDepositAmount: 9600000, depositMonths: 2, availabilityStatus: AvailabilityStatus.AVAILABLE, publishedAt: new Date(), preferredTenantTypes: ["Family"] }, img: "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200&q=80" },

    // Banani Orchid Tower
    { b: "banani-orchid-tower", floor: 3, unit: "3A", data: { facing: "West", sizeSqft: 1250, bedrooms: 3, attachedBathrooms: 2, bathrooms: 2, diningRooms: 1, drawingRooms: 1, kitchens: 1, verandas: 2, gasType: GasType.LINE, rentAmount: 3800000, serviceCharge: 300000, securityDepositAmount: 7600000, depositMonths: 2, availabilityStatus: AvailabilityStatus.AVAILABLE, publishedAt: new Date(), preferredTenantTypes: ["Family"] }, img: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80" },
    { b: "banani-orchid-tower", floor: 7, unit: "7B", data: { facing: "South", sizeSqft: 900, bedrooms: 2, attachedBathrooms: 1, bathrooms: 2, diningRooms: 0, drawingRooms: 1, kitchens: 1, verandas: 1, gasType: GasType.LINE, rentAmount: 3000000, serviceCharge: 250000, securityDepositAmount: 6000000, depositMonths: 2, availabilityStatus: AvailabilityStatus.AVAILABLE, publishedAt: new Date(), preferredTenantTypes: ["Bachelor", "Couple"] }, img: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=1200&q=80" },

    // Uttara Skyline Homes
    { b: "uttara-skyline-homes", floor: 6, unit: "6C", data: { facing: "South-East", sizeSqft: 1380, bedrooms: 3, attachedBathrooms: 2, bathrooms: 3, diningRooms: 1, drawingRooms: 1, kitchens: 1, verandas: 2, gasType: GasType.LINE, rentAmount: 3200000, serviceCharge: 300000, securityDepositAmount: 6400000, depositMonths: 2, availabilityStatus: AvailabilityStatus.AVAILABLE, publishedAt: new Date(), preferredTenantTypes: ["Family"] }, img: "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=1200&q=80" },
    { b: "uttara-skyline-homes", floor: 9, unit: "9A", data: { facing: "North-East", sizeSqft: 1750, bedrooms: 4, attachedBathrooms: 3, bathrooms: 4, diningRooms: 1, drawingRooms: 1, kitchens: 1, verandas: 3, gasType: GasType.LINE, rentAmount: 4200000, serviceCharge: 400000, securityDepositAmount: 8400000, depositMonths: 2, availabilityStatus: AvailabilityStatus.AVAILABLE, publishedAt: new Date(), preferredTenantTypes: ["Family"] }, img: "https://images.unsplash.com/photo-1460317442991-0ec209397118?w=1200&q=80" },

    // Mirpur Garden View
    { b: "mirpur-garden-view", floor: 3, unit: "3B", data: { facing: "East", sizeSqft: 1100, bedrooms: 3, attachedBathrooms: 1, bathrooms: 2, diningRooms: 1, drawingRooms: 0, kitchens: 1, verandas: 2, gasType: GasType.LINE, rentAmount: 2400000, serviceCharge: 200000, securityDepositAmount: 4800000, depositMonths: 2, availabilityStatus: AvailabilityStatus.AVAILABLE, publishedAt: new Date(), preferredTenantTypes: ["Family"] }, img: "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=1200&q=80" },
    { b: "mirpur-garden-view", floor: 5, unit: "5A", data: { facing: "South", sizeSqft: 850, bedrooms: 2, attachedBathrooms: 1, bathrooms: 1, diningRooms: 1, drawingRooms: 0, kitchens: 1, verandas: 1, gasType: GasType.CYLINDER, rentAmount: 1800000, serviceCharge: 150000, securityDepositAmount: 3600000, depositMonths: 2, availabilityStatus: AvailabilityStatus.AVAILABLE, publishedAt: new Date(), preferredTenantTypes: ["Small Family", "Bachelor"] }, img: "https://images.unsplash.com/photo-1501183638710-841dd1904471?w=1200&q=80" },

    // Bashundhara Palm Court
    { b: "bashundhara-palm-court", floor: 10, unit: "10A", data: { facing: "South", sizeSqft: 1950, bedrooms: 4, attachedBathrooms: 3, bathrooms: 4, diningRooms: 1, drawingRooms: 1, kitchens: 1, verandas: 3, gasType: GasType.LINE, rentAmount: 5500000, serviceCharge: 500000, securityDepositAmount: 11000000, depositMonths: 2, availabilityStatus: AvailabilityStatus.AVAILABLE, publishedAt: new Date(), preferredTenantTypes: ["Family", "Executive"] }, img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80" },
    { b: "bashundhara-palm-court", floor: 7, unit: "7D", data: { facing: "North-West", sizeSqft: 1320, bedrooms: 3, attachedBathrooms: 2, bathrooms: 3, diningRooms: 1, drawingRooms: 1, kitchens: 1, verandas: 2, gasType: GasType.LINE, rentAmount: 4000000, serviceCharge: 350000, securityDepositAmount: 8000000, depositMonths: 2, availabilityStatus: AvailabilityStatus.AVAILABLE, publishedAt: new Date(), preferredTenantTypes: ["Family"] }, img: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80" },
    { b: "bashundhara-palm-court", floor: 4, unit: "4C", data: { facing: "East", sizeSqft: 1050, bedrooms: 2, attachedBathrooms: 2, bathrooms: 2, diningRooms: 1, drawingRooms: 1, kitchens: 1, verandas: 1, gasType: GasType.LINE, rentAmount: 3000000, serviceCharge: 280000, securityDepositAmount: 6000000, depositMonths: 2, availabilityStatus: AvailabilityStatus.COMING_SOON, publishedAt: new Date(), preferredTenantTypes: ["Couple", "Small Family"] }, img: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&q=80" },
  ];

  for (const def of aptDefs) {
    const building = buildings[def.b];
    if (!building) continue;
    const floor = await upsertFloor(building.id, def.floor);
    const apt = await upsertApartment(floor.id, building.id, def.unit, def.data);
    await upsertApartmentImage(apt.id, `seed/${apt.id}/cover.jpg`, {
      url: def.img,
      roomTag: RoomTag.COVER,
      sortOrder: 0,
    });
  }

  console.log(`Seeded ${buildingsData.length} buildings and ${aptDefs.length} apartments.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
