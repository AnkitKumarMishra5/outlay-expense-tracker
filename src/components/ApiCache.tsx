"use client";

import { useEffect } from "react";
import { installApiCacheInvalidation } from "@/lib/api";

/** Mounted once in the root layout so every write to the API clears cached reads. */
export default function ApiCache() {
  useEffect(installApiCacheInvalidation, []);
  return null;
}
