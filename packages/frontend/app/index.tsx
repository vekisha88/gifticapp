import { Redirect } from "expo-router";

import { API_BASE_URL } from "../config/env";

console.log("Here");
console.log(API_BASE_URL);
export default function Index() {
  return <Redirect href="/buy" />;
}
