"use strict";
// lib/index.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = exports.prisma = void 0;
var prisma_1 = require("./prisma");
Object.defineProperty(exports, "prisma", { enumerable: true, get: function () { return __importDefault(prisma_1).default; } });
var supabaseClient_1 = require("./supabaseClient");
Object.defineProperty(exports, "supabase", { enumerable: true, get: function () { return supabaseClient_1.supabase; } });
