import { IntakeTarget } from '../types/intake.types';

export class CreateIntakeBatchDto {
  intakeTarget!: IntakeTarget;
  batchDate!: string;
  primaryChannelCode?: string;
  defaultDemandDate?: string | null;
  planningWindowId?: string | null;
  note?: string;
  createdBy?: string;
}