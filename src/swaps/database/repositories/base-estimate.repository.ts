import { BaseEstimate } from "../entities/base-estimate.entity";
import { SwapDatabaseModule } from "../typeorm";

const getRepo = () => {
  return SwapDatabaseModule.getDatabase().getRepository(BaseEstimate);
};

const findAll = () => {
  return getRepo().find({ relations: ["swapSteps"] });
};

const findById = (id: string) => {
  return getRepo().findOne({ where: { id: id } });
};

const create = async (baseEstimate: BaseEstimate) => {
  try {
    baseEstimate.steps = baseEstimate.steps.map((s, index) => {
      return { ...s, stepNumber: index + 1 };
    });
    console.log(baseEstimate);
    const request = await getRepo().save(baseEstimate);
    return request;
  } catch (err) {
    console.log(err);
  }
};

const update = async (baseEstimate: BaseEstimate) => {
  await getRepo().save(baseEstimate);
};

export const BaseEstimateRepository = {
  create,
  update,
  findById,
  findAll,
};
