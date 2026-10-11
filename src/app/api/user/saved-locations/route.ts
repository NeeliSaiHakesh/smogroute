import { NextRequest, NextResponse } from 'next/server';
import { INITIAL_SAVED_ROUTES } from '@/lib/mockData';
import { SavedRoute } from '@/types';

// In-memory DynamoDB simulation store for User Saved Routes
let userSavedRoutesTable: SavedRoute[] = [...INITIAL_SAVED_ROUTES];

export async function GET() {
  return NextResponse.json({
    TableName: 'SmogRoute_UserSavedRoutes_Prod',
    UserId: 'usr-node-4819',
    TableStatus: 'ACTIVE',
    KeySchema: [
      { AttributeName: 'user_id', KeyType: 'HASH' },
      { AttributeName: 'route_id', KeyType: 'RANGE' },
    ],
    ItemCount: userSavedRoutesTable.length,
    Items: userSavedRoutesTable,
    ConsumedCapacity: {
      TableName: 'SmogRoute_UserSavedRoutes_Prod',
      CapacityUnits: 1.0,
      ReadCapacityUnits: 1.0,
    },
    SyncTimestamp: Date.now(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const item: SavedRoute = await req.json();

    if (!item.id || !item.originName || !item.destinationName) {
      return NextResponse.json(
        { error: 'ValidationException: Required parameters missing.' },
        { status: 400 }
      );
    }

    // Filter out if exists and prepend
    userSavedRoutesTable = [item, ...userSavedRoutesTable.filter((r) => r.id !== item.id)];

    return NextResponse.json({
      statusCode: 200,
      ConsumedCapacity: {
        TableName: 'SmogRoute_UserSavedRoutes_Prod',
        CapacityUnits: 2.0,
        WriteCapacityUnits: 2.0,
      },
      Attributes: item,
      Message: 'PutItem succeeded into DynamoDB Table SmogRoute_UserSavedRoutes_Prod',
    });
  } catch {
    return NextResponse.json(
      { error: 'InternalServerError: Failed to put item to DynamoDB' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing route id parameter' }, { status: 400 });
    }

    userSavedRoutesTable = userSavedRoutesTable.filter((r) => r.id !== id);

    return NextResponse.json({
      statusCode: 200,
      ConsumedCapacity: {
        TableName: 'SmogRoute_UserSavedRoutes_Prod',
        CapacityUnits: 1.0,
        WriteCapacityUnits: 1.0,
      },
      DeletedId: id,
      Message: 'DeleteItem succeeded from DynamoDB',
    });
  } catch {
    return NextResponse.json(
      { error: 'InternalServerError: Failed to delete item' },
      { status: 500 }
    );
  }
}
