"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AzureQueueClient = exports.AzureBlobsClient = exports.AzureTablesClient = exports.MockQueueClient = exports.MockBlobsClient = exports.MockTablesClient = void 0;
__exportStar(require("./types"), exports);
__exportStar(require("./factory"), exports);
var mockTablesClient_1 = require("./mock/mockTablesClient");
Object.defineProperty(exports, "MockTablesClient", { enumerable: true, get: function () { return mockTablesClient_1.MockTablesClient; } });
var mockBlobsClient_1 = require("./mock/mockBlobsClient");
Object.defineProperty(exports, "MockBlobsClient", { enumerable: true, get: function () { return mockBlobsClient_1.MockBlobsClient; } });
var mockQueueClient_1 = require("./mock/mockQueueClient");
Object.defineProperty(exports, "MockQueueClient", { enumerable: true, get: function () { return mockQueueClient_1.MockQueueClient; } });
var azureTablesClient_1 = require("./azure/azureTablesClient");
Object.defineProperty(exports, "AzureTablesClient", { enumerable: true, get: function () { return azureTablesClient_1.AzureTablesClient; } });
var azureBlobsClient_1 = require("./azure/azureBlobsClient");
Object.defineProperty(exports, "AzureBlobsClient", { enumerable: true, get: function () { return azureBlobsClient_1.AzureBlobsClient; } });
var azureQueueClient_1 = require("./azure/azureQueueClient");
Object.defineProperty(exports, "AzureQueueClient", { enumerable: true, get: function () { return azureQueueClient_1.AzureQueueClient; } });
