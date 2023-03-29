import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { SwapStep } from "./swap-step.entity";

@Entity({ name: "base-estimate" })
export class BaseEstimate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  slipperage: number;

  @OneToMany(() => SwapStep, (swapStep) => swapStep.id, {
    cascade: true,
  })
  steps: SwapStep[];
}
