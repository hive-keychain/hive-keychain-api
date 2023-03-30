import { BaseEstimate } from "../database/entities/base-estimate.entity";
import { BaseEstimateRepository } from "../database/repositories/base-estimate.repository";

const saveBaseEstimate = async (baseEstimate: BaseEstimate) => {
  const savedBaseEstimate = await BaseEstimateRepository.create(baseEstimate);
  return savedBaseEstimate.id;
};

export const BaseEstimateLogic = { saveBaseEstimate };
