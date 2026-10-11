import { NextRequest, NextResponse } from 'next/server';
import { calculateRouteComparison, getRouteByPresetId } from '@/lib/routeEngine';
import { TravelMode } from '@/types';

// AWS API Gateway + AWS Lambda Pattern: Route Exposure Calculation Handler
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await req.json();
    const { presetId = 'dtu-rohini', mode = 'pedestrian', activeHazards = [] } = body;

    const routeDef = getRouteByPresetId(presetId);
    const result = calculateRouteComparison(routeDef, mode as TravelMode, activeHazards);
    
    const processingMs = Date.now() - startTime;
    const awsRequestId = `amzn-req-${Math.random().toString(36).substring(2, 11)}-ap-south-1`;

    return NextResponse.json(
      {
        statusCode: 200,
        headers: {
          'x-amzn-RequestId': awsRequestId,
          'x-amzn-Remapped-Content-Length': '1024',
          'x-amz-apigw-id': 'SMR_GW_ROUTING_PROD',
        },
        body: result,
      },
      {
        status: 200,
        headers: {
          'x-amzn-RequestId': awsRequestId,
          'x-lambda-execution-time': `${processingMs}ms`,
          'content-type': 'application/json',
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        statusCode: 500,
        error: 'LambdaRouteExecutionError',
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
