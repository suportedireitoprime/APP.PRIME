"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var jsx_runtime_1 = require("react/jsx-runtime");
var server_1 = require("react-dom/server");
var server_2 = require("react-router-dom/server");
var AdminPush_1 = __importDefault(require("./src/pages/AdminPush"));
try {
    console.log("Rendering...");
    var html = (0, server_1.renderToString)((0, jsx_runtime_1.jsx)(server_2.StaticRouter, { location: "/admin-push", children: (0, jsx_runtime_1.jsx)(AdminPush_1.default, {}) }));
    console.log("Render successful!");
}
catch (e) {
    console.error("RENDER ERROR:", e.message, e.stack);
}
