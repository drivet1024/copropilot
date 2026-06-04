export type MockUnit = {
  unitNumber: string;
  buildingName: string;
  ownerName: string;
  phone: string;
  email: string;
  sharePercentage: string;
  parking: string;
  locker: string;
  status: "Occupant" | "Non occupant";
};

export const mockUnits: MockUnit[] = [
  {
    unitNumber: "101",
    buildingName: "Bâtiment A",
    ownerName: "Sophie Martin",
    phone: "514 555-1234",
    email: "sophie.martin@example.com",
    sharePercentage: "2,10 %",
    parking: "P-01",
    locker: "C-101",
    status: "Occupant",
  },
  {
    unitNumber: "102",
    buildingName: "Bâtiment A",
    ownerName: "Marc Tremblay",
    phone: "514 555-5678",
    email: "marc.tremblay@example.com",
    sharePercentage: "1,95 %",
    parking: "P-02",
    locker: "C-102",
    status: "Non occupant",
  },
  {
    unitNumber: "201",
    buildingName: "Bâtiment A",
    ownerName: "Nadia Gagnon",
    phone: "514 555-9012",
    email: "nadia.gagnon@example.com",
    sharePercentage: "2,35 %",
    parking: "P-14",
    locker: "C-201",
    status: "Occupant",
  },
];
