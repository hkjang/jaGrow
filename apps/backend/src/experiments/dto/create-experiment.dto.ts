export class CreateExperimentVariationDto {
  name: string;
  key: string;
  weight: number;
  config?: any;
}

export class CreateExperimentDto {
  name: string;
  description?: string;
  trafficAllocation?: number;
  variations: CreateExperimentVariationDto[];
}
