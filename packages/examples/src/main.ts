import { Subsquid } from "./config/app";
import dotenv from "dotenv";

dotenv.config();

BigInt.prototype.toJSON = function () {
  return this.toString();
};

(async () => await new Subsquid().run())();
