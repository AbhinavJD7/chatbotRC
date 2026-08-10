import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

const exporter = new OTLPTraceExporter({
  // This is the default gRPC endpoint for a local SigNoz setup
  url: 'http://localhost:4317', 
});

const sdk = new NodeSDK({
  traceExporter: exporter,
  instrumentations: [getNodeAutoInstrumentations()],
  // Name your service something recognizable so it pops up in SigNoz
  serviceName: 'ai-rag-chatbot', 
});

sdk.start();
console.log('OpenTelemetry initialized and connected to SigNoz!');