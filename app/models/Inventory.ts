export interface IInventory {
  _id: string;
  patientId: string;
  itemName: string;
  description?: string;
  quantity: number;
  unit: string;
  lastUsed?: Date;
  needsReplenishment: boolean;
  lowStockThreshold: number;
  createdAt: Date;
  updatedAt: Date;
}
