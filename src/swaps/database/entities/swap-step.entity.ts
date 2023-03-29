import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { BaseEstimate } from "./base-estimate.entity";

@Entity({ name: "swap-step" })
export class SwapStep {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  step: string;

  @Column()
  stepNumber: number;

  @Column()
  estimate: number;

  @Column()
  startToken: string;

  @Column()
  endToken: string;

  @Column()
  provider: string;

  @ManyToOne(() => BaseEstimate, (baseEstimate) => baseEstimate.steps, {
    nullable: false,
  })
  baseEstimate: BaseEstimate;
}
