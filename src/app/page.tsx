"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { RefreshCw, Save } from "lucide-react"
import { useToast } from '@/components/ui/use-toast'
import initialData from './initial_data.json'

type Exercise = {
  name: string;
  maxWeight: number;
  currentWeight: number;
  normalSetReps: number;
  lastSetReps: number;
  achievedReps: number;
  setGoal: number;
}

type WorkoutDay = {
  name: string;
  exercises: Exercise[];
}

type InitialValue = {
  name: string;
  maxWeight: number;
  singleAt8Percentage: number;
}

type WorkoutData = {
  currentWeek: number;
  workoutDays: WorkoutDay[];
  selectedAccessories: string[];
  initialWeights: InitialValue[];
}

type WeeklyAchievedReps = {
  [week: number]: {
    [dayIndex: number]: {
      [exerciseIndex: number]: number
    }
  }
}

const accessoryExercises = [
  "None",  // Add "None" as the first option
  "Barbell rows", "DB rows", "Chest supported rows", "T-bar rows",
  "Pull-ups", "Chin-ups", "Neutral grip pull-ups", "Pull-downs"
]

const exercises = [
  'Squat', 'Bench Press', 'Deadlift', 'OHP', 'Front Squat', 
  'Close Grip Bench', 'Romanian deadlift', 'Push Press'
];

const intensities = [
  [70.0, 75.0, 80.0, 72.5, 77.5, 82.5, 60.0, 75.0, 80.0, 85.0, 77.5, 82.5, 87.5, 60.0, 80.0, 85.0, 90.0, 85.0, 90.0, 95.0, 60.0],
  [70.0, 75.0, 80.0, 72.5, 77.5, 82.5, 60.0, 75.0, 80.0, 85.0, 77.5, 82.5, 87.5, 60.0, 80.0, 85.0, 90.0, 85.0, 90.0, 95.0, 60.0],
  [70.0, 75.0, 80.0, 72.5, 77.5, 82.5, 60.0, 75.0, 80.0, 85.0, 77.5, 82.5, 87.5, 60.0, 80.0, 85.0, 90.0, 85.0, 90.0, 95.0, 60.0],
  [70.0, 75.0, 80.0, 72.5, 77.5, 82.5, 60.0, 75.0, 80.0, 85.0, 77.5, 82.5, 87.5, 60.0, 80.0, 85.0, 90.0, 85.0, 90.0, 95.0, 60.0],
  [60.0, 65.0, 70.0, 62.5, 67.5, 72.5, 50.0, 65.0, 70.0, 75.0, 67.5, 72.5, 77.5, 50.0, 70.0, 75.0, 80.0, 75.0, 80.0, 85.0, 50.0],
  [60.0, 65.0, 70.0, 62.5, 67.5, 72.5, 50.0, 65.0, 70.0, 75.0, 67.5, 72.5, 77.5, 50.0, 70.0, 75.0, 80.0, 75.0, 80.0, 85.0, 50.0],
  [60.0, 65.0, 70.0, 62.5, 67.5, 72.5, 50.0, 65.0, 70.0, 75.0, 67.5, 72.5, 77.5, 50.0, 70.0, 75.0, 80.0, 75.0, 80.0, 85.0, 50.0],
  [60.0, 65.0, 70.0, 62.5, 67.5, 72.5, 50.0, 65.0, 70.0, 75.0, 67.5, 72.5, 77.5, 50.0, 70.0, 75.0, 80.0, 75.0, 80.0, 85.0, 50.0],
];

function useWorkoutData() {
  const [data, setData] = useState<WorkoutData>(() => {
    // Initialize data with initial values, but clear achievedReps for weeks > 1
    const initializedData = JSON.parse(JSON.stringify(initialData));
    initializedData.workoutDays = initializedData.workoutDays.map((day: WorkoutDay) => ({
      ...day,
      exercises: day.exercises.map((exercise: Exercise) => ({
        ...exercise,
        achievedReps: initializedData.currentWeek === 1 ? exercise.achievedReps : 0
      }))
    }));
    return initializedData;
  });
  const { showToast } = useToast();

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch('/api/workout');
      const fetchedData: WorkoutData = await response.json();
      setData(fetchedData);
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast({
        message: "Failed to fetch workout data. Please try again.",
        type: "error",
      });
    }
  }, [showToast]);

  useEffect(() => {
    fetchData();
  }, []);

  return { data, setData, fetchData };
}

export default function WorkoutProgram() {
  const { data: workoutData, setData: setWorkoutData, fetchData } = useWorkoutData();
  const { showToast } = useToast();

  // Add this state to store achieved reps for each week
  const [weeklyAchievedReps, setWeeklyAchievedReps] = useState<WeeklyAchievedReps>({});

  const updateCurrentWeights = useCallback(() => {
    setWorkoutData(prevData => {
      const newData = { ...prevData };
      newData.workoutDays = newData.workoutDays.map(day => ({
        ...day,
        exercises: day.exercises.map(exercise => {
          const exerciseIndex = exercises.indexOf(exercise.name);
          const intensity = intensities[exerciseIndex][newData.currentWeek - 1] / 100;
          if (exercise.maxWeight) {
            const currentWeight = Math.round(exercise.maxWeight * intensity * 2) / 2;
            return { 
              ...exercise, 
              currentWeight,
              achievedReps: newData.currentWeek === 1 ? exercise.achievedReps : 0
            };
          }
          return exercise;
        })
      }));
      return newData;
    });
  }, []);

  useEffect(() => {
    updateCurrentWeights();
  }, [workoutData.currentWeek, updateCurrentWeights]);

  const updateBackend = useCallback(async (data: WorkoutData) => {
    try {
      const response = await fetch('/api/workout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to update data');
      }
    } catch (error) {
      console.error('Error updating data:', error);
      showToast({
        message: "Failed to update workout data. Please try again.",
        type: "error",
      });
    }
  }, [showToast]);

  const calculateCurrentWeight = useCallback((exercise: Exercise, week: number, dayIndex: number, exIndex: number) => {
    const exerciseIndex = exercises.indexOf(exercise.name);
    const intensity = intensities[exerciseIndex][week - 1] / 100;
    let maxWeight = exercise.maxWeight;

    // Adjust maxWeight based on previous week's performance
    if (week > 1) {
      const prevWeekAchievedReps = weeklyAchievedReps[week - 1]?.[dayIndex]?.[exIndex];
      if (prevWeekAchievedReps !== undefined) {
        const repDifference = prevWeekAchievedReps - exercise.lastSetReps;
        
        if (repDifference > 0) {
          // Exceeded target reps
          if (repDifference === 1) {
            maxWeight = Math.round((maxWeight * 1.01) * 2) / 2; // 1% increase
          } else if (repDifference === 2) {
            maxWeight = Math.round((maxWeight * 1.02) * 2) / 2; // 2% increase
          } else if (repDifference >= 3) {
            maxWeight = Math.round((maxWeight * 1.03) * 2) / 2; // 3% increase
          }
        } else if (repDifference < -1) {
          // Missed target reps by 2 or more
          if (repDifference === -2) {
            maxWeight = Math.round((maxWeight * 0.98) * 2) / 2; // 2% decrease
          } else if (repDifference <= -3) {
            maxWeight = Math.round((maxWeight * 0.97) * 2) / 2; // 3% decrease
          }

        }
        // If repDifference is -1, 0, or 1, no adjustment is made
      }
    }

    return Math.round(maxWeight * intensity * 2) / 2;
  }, [weeklyAchievedReps]);

  const changeWeek = useCallback(async (increment: boolean) => {
    const newWeek = increment
      ? Math.min(workoutData.currentWeek + 1, 21)
      : Math.max(workoutData.currentWeek - 1, 1);
    
    setWorkoutData(prevData => {
      const newData = { ...prevData, currentWeek: newWeek };
      newData.workoutDays = newData.workoutDays.map((day, dayIndex) => ({
        ...day,
        exercises: day.exercises.map((exercise, exerciseIndex) => {
          if (exercise.maxWeight) {
            const currentWeight = calculateCurrentWeight(exercise, newWeek, dayIndex, exerciseIndex);
            return { 
              ...exercise, 
              currentWeight,
              achievedReps: weeklyAchievedReps[newWeek]?.[dayIndex]?.[exerciseIndex] || 0
            };
          }
          return exercise;
        })
      }));
      return newData;
    });

    try {
      await updateBackend({ ...workoutData, currentWeek: newWeek });
      console.log('Week updated successfully on the server');
    } catch (error) {
      console.error('Error updating week:', error);
      showToast({
        message: "Failed to update week. Please try again.",
        type: "error",
      });
    }
  }, [workoutData, updateBackend, showToast, weeklyAchievedReps, calculateCurrentWeight]);

  const handleAchievedRepsChange = useCallback((dayIndex: number, exerciseIndex: number, value: number) => {
    setWorkoutData(prevData => {
      const newData = { ...prevData };
      const exercise = newData.workoutDays[dayIndex].exercises[exerciseIndex];
      exercise.achievedReps = value;

      // Store the achieved reps for the current week
      setWeeklyAchievedReps(prev => ({
        ...prev,
        [newData.currentWeek]: {
          ...prev[newData.currentWeek],
          [dayIndex]: {
            ...prev[newData.currentWeek]?.[dayIndex],
            [exerciseIndex]: value
          }
        }
      }));

      updateBackend(newData);
      return newData;
    });
  }, [updateBackend]);

  const incrementWeek = useCallback(() => changeWeek(true), [changeWeek]);
  const decrementWeek = useCallback(() => changeWeek(false), [changeWeek]);

  const handleAccessoryChange = useCallback((index: number, value: string) => {
    setWorkoutData(prevData => {
      const newData = { ...prevData }
      newData.selectedAccessories[index] = value
      updateBackend(newData)
      return newData
    })
  }, [updateBackend]);

  const handleInitialWeightChange = useCallback((index: number, field: 'maxWeight' | 'singleAt8Percentage', value: number) => {
    setWorkoutData(prevData => {
      const newData = { ...prevData }
      newData.initialWeights[index][field] = value
      updateBackend(newData)
      return newData
    })
  }, [updateBackend]);

  const handleRefresh = useCallback(() => {
    fetchData();
    showToast({
      message: "Workout program refreshed successfully.",
      type: "success",
    });
  }, [fetchData, showToast]);

  const handleSave = useCallback(async () => {
    try {
      await updateBackend(workoutData);
      showToast({
        message: "Workout program saved successfully.",
        type: "success",
      });
    } catch (error) {
      console.error('Error saving data:', error);
      showToast({
        message: "Failed to save workout data. Please try again.",
        type: "error",
      });
    }
  }, [workoutData, updateBackend, showToast]);

  // Memoize the rendered content to prevent unnecessary re-renders
  const renderedContent = useMemo(() => (
    <div className="container mx-auto p-4 relative pb-16">
      <h1 className="text-2xl font-bold mb-4">21-Week Workout Program</h1>
      
      <Tabs defaultValue="program">
        <TabsList>
          <TabsTrigger value="program">Workout Program</TabsTrigger>
          <TabsTrigger value="initial">Initial Values</TabsTrigger>
        </TabsList>

        <TabsContent value="program">
          <div className="flex items-center justify-between mb-4">
            <Button onClick={decrementWeek} disabled={workoutData.currentWeek === 1}>Previous Week</Button>
            <h2 className="text-xl font-semibold">Week {workoutData.currentWeek}</h2>
            <Button onClick={incrementWeek} disabled={workoutData.currentWeek === 21}>Next Week</Button>
          </div>

          <Tabs defaultValue="day1">
            <TabsList>
              {workoutData.workoutDays.map((day, index) => (
                <TabsTrigger key={index} value={`day${index + 1}`}>{day.name}</TabsTrigger>
              ))}
            </TabsList>

            {workoutData.workoutDays.map((day, dayIndex) => (
              <TabsContent key={dayIndex} value={`day${dayIndex + 1}`}>
                <Card>
                  <CardHeader>
                    <CardTitle>{day.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Exercise</TableHead>
                          <TableHead>Current Weight (kg)</TableHead>
                          <TableHead>Normal Set Reps</TableHead>
                          <TableHead>Last Set Reps</TableHead>
                          <TableHead>Reps on last set</TableHead>
                          <TableHead>Set Goal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {day.exercises.map((exercise, exerciseIndex) => (
                          <TableRow key={exerciseIndex}>
                            <TableCell>{exercise.name}</TableCell>
                            <TableCell>{exercise.currentWeight}</TableCell>
                            <TableCell>{exercise.normalSetReps}</TableCell>
                            <TableCell>{exercise.lastSetReps}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={exercise.achievedReps}
                                onChange={(e) => handleAchievedRepsChange(dayIndex, exerciseIndex, Number(e.target.value))}
                                className="w-20"
                              />
                            </TableCell>
                            <TableCell>{exercise.setGoal}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Accessory Work</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Choose 2-3 accessory exercises per workout.
              Perform 3 sets of 8-12 reps for each, or 3 sets of 20-25 reps for isolation exercises.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[0, 1, 2].map((index) => (
                  <div key={index} className="flex flex-col space-y-2">
                    <Label htmlFor={`accessory-${index}`}>Accessory Exercise {index + 1}</Label>
                    <Select
                      value={workoutData.selectedAccessories[index] || "None"}
                      onValueChange={(value) => handleAccessoryChange(index, value)}
                    >
                      <SelectTrigger id={`accessory-${index}`}>
                        <SelectValue placeholder="Select an exercise" />
                      </SelectTrigger>
                      <SelectContent>
                        {accessoryExercises.map((exercise) => (
                          <SelectItem key={exercise} value={exercise}>
                            {exercise}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="initial">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                Initial Values
                <Button onClick={handleRefresh} className="ml-4">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Program
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Exercise</TableHead>
                    <TableHead>Max Weight (kg)</TableHead>
                    <TableHead>Single @8 Percentage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workoutData.initialWeights.map((exercise, index) => (
                    <TableRow key={index}>
                      <TableCell>{exercise.name}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={exercise.maxWeight}
                          onChange={(e) => handleInitialWeightChange(index, 'maxWeight', Number(e.target.value))}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={exercise.singleAt8Percentage}
                          onChange={(e) => handleInitialWeightChange(index, 'singleAt8Percentage', Number(e.target.value))}
                          className="w-20"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="fixed bottom-4 right-4">
        <Button onClick={handleSave} className="rounded-full w-16 h-16">
          <Save className="h-6 w-6" />
        </Button>
      </div>
    </div>
  ), [workoutData, incrementWeek, decrementWeek, handleAchievedRepsChange, handleAccessoryChange, handleInitialWeightChange, handleRefresh, handleSave, showToast]);

  return renderedContent;
}