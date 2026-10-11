import { NextRequest, NextResponse } from 'next/server';
import { HazardType, RekognitionVerificationResponse } from '@/types';
import { DEMO_HAZARD_SAMPLES } from '@/lib/mockData';

// Amazon Rekognition / SageMaker Endpoint Mock Handler
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      hazardType = 'Garbage Burning', 
      sampleId, 
      fileName = 'uploaded_incident.jpg',
    } = body;

    // Simulate S3 object upload path
    const fileId = Math.random().toString(36).substring(2, 9);
    const s3Uri = `s3://smogroute-incident-evidence-prod/incoming/${Date.now()}-${fileId}.jpg`;

    // Match sample if provided, otherwise evaluate deterministically
    const matchedSample = DEMO_HAZARD_SAMPLES.find((s) => s.id === sampleId);

    let verificationStatus: 'VERIFIED' | 'REJECTED' = 'VERIFIED';
    let confidenceScore = 94.6;
    let detectedLabels: Array<{ Name: string; Confidence: number }> = [];

    if (matchedSample) {
      verificationStatus = matchedSample.willPass ? 'VERIFIED' : 'REJECTED';
      confidenceScore = matchedSample.presetConfidence;
      detectedLabels = matchedSample.mockLabels;
    } else {
      // Deterministic evaluation based on selected hazard type
      if (fileName.toLowerCase().includes('clean') || fileName.toLowerCase().includes('invalid')) {
        verificationStatus = 'REJECTED';
        confidenceScore = 31.5;
        detectedLabels = [
          { Name: 'Pavement', Confidence: 94.2 },
          { Name: 'Surface Road', Confidence: 88.5 },
        ];
      } else {
        switch (hazardType as HazardType) {
          case 'Garbage Burning':
            confidenceScore = 95.8;
            detectedLabels = [
              { Name: 'Smoke Plume', Confidence: 97.4 },
              { Name: 'Combustion', Confidence: 94.1 },
              { Name: 'Waste Debris', Confidence: 91.5 },
            ];
            break;
          case 'Construction Dust':
            confidenceScore = 93.4;
            detectedLabels = [
              { Name: 'Particulate Dust Cloud', Confidence: 95.8 },
              { Name: 'Aggregates', Confidence: 92.0 },
              { Name: 'Construction Excavation', Confidence: 89.4 },
            ];
            break;
          case 'Diesel Smoke':
            confidenceScore = 92.1;
            detectedLabels = [
              { Name: 'Heavy Vehicle Exhaust', Confidence: 94.6 },
              { Name: 'Carbon Plume', Confidence: 91.0 },
            ];
            break;
          case 'Road Spill':
            confidenceScore = 89.7;
            detectedLabels = [
              { Name: 'Surface Fluid', Confidence: 92.4 },
              { Name: 'Obstruction', Confidence: 87.0 },
            ];
            break;
        }
      }
    }

    const latency = Math.floor(28 + Math.random() * 15);

    const responsePayload: RekognitionVerificationResponse = {
      verificationStatus,
      confidenceScore,
      detectedLabels,
      hazardType: hazardType as HazardType,
      passCriteriaMet: verificationStatus === 'VERIFIED',
      awsExecutionMetadata: {
        service: 'Amazon Rekognition',
        modelArn: 'arn:aws:rekognition:ap-south-1:719284102938:project/smogroute-cv-detector/version/prod-1.4',
        inferenceLatencyMs: latency,
        s3BucketUri: s3Uri,
      },
    };

    return NextResponse.json(
      {
        statusCode: 200,
        headers: {
          'x-amzn-rekognition-model': 'smogroute-cv-detector-v1.4',
          'x-amzn-inference-time': `${latency}ms`,
        },
        body: responsePayload,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        statusCode: 500,
        error: 'RekognitionInferenceException',
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
