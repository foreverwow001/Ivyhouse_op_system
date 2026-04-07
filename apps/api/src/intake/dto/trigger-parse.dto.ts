export class TriggerParseDto {
  sourceFileIds!: string[];
  forceReparse?: boolean;
  triggeredBy?: string;
}