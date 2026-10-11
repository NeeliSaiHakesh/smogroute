import { NextRequest, NextResponse } from 'next/server';
import { INITIAL_HAZARDS } from '@/lib/mockData';
import { HazardPin } from '@/types';

// In-memory DynamoDB simulation store
let dynamoDbTable: HazardPin[] = [...INITIAL_HAZARDS];

export async function GET() {
  return NextResponse.json({
    TableName: 'SmogRoute_MicroHazards_Prod',
    TableStatus: 'ACTIVE',
    KeySchema: [
      { AttributeName: 'hazard_id', KeyType: 'HASH' },
      { AttributeName: 'timestamp', KeyType: 'RANGE' },
    ],
    AttributeDefinitions: [
      { AttributeName: 'hazard_id', AttributeType: 'S' },
      { AttributeName: 'timestamp', AttributeType: 'N' },
      { AttributeName: 'status', AttributeType: 'S' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'StatusTimestampIndex',
        KeySchema: [
          { AttributeName: 'status', KeyType: 'HASH' },
          { AttributeName: 'timestamp', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
      },
    ],
    ItemCount: dynamoDbTable.length,
    Items: dynamoDbTable,
    ConsumedCapacity: {
      TableName: 'SmogRoute_MicroHazards_Prod',
      CapacityUnits: 1.0,
      ReadCapacityUnits: 1.0,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const item: HazardPin = await req.json();

    if (!item.hazard_id || !item.hazard_type || !item.coordinates) {
      return NextResponse.json(
        { error: 'ValidationException: One or more parameter values were invalid.' },
        { status: 400 }
      );
    }

    // Prepend new item
    dynamoDbTable = [item, ...dynamoDbTable];

    return NextResponse.json({
      statusCode: 200,
      ConsumedCapacity: {
        TableName: 'SmogRoute_MicroHazards_Prod',
        CapacityUnits: 2.0,
        WriteCapacityUnits: 2.0,
      },
      Attributes: item,
      Message: 'PutItem succeeded into DynamoDB Table SmogRoute_MicroHazards_Prod',
    });
  } catch {
    return NextResponse.json(
      { error: 'InternalServerError: Failed to put item to DynamoDB' },
      { status: 500 }
    );
  }
}
