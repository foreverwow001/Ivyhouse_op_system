import { IntakeTarget } from '../types/intake.types';

export class UploadSourceFileDto {
  channelCode!: string;
  intakeTarget!: IntakeTarget;
  uploadedBy?: string;
}