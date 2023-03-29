import { Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "transaction-history" })
export class TransactionHistory {
  @PrimaryGeneratedColumn()
  id: number;
}
