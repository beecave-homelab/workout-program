import { NextRequest, NextResponse } from 'next/server'
import initialData from '../../initial_data.json'

let workoutData = initialData

export async function GET(req: NextRequest) {
  return NextResponse.json(workoutData)
}

export async function POST(req: NextRequest) {
  const data = await req.json()
  workoutData = data
  return NextResponse.json({ message: 'Workout data updated successfully' })
}