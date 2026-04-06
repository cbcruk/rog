declare module 'garmin-connect' {
  export interface Activity {
    activityId: number
    activityName?: string
    startTimeLocal?: string
  }

  interface ActivityRef {
    activityId: number
  }

  export class GarminConnect {
    login(email: string, password: string): Promise<void>
    getActivities(start: number, limit: number): Promise<Activity[]>
    downloadOriginalActivityData(
      activity: ActivityRef,
      dir: string,
      format: string,
    ): Promise<void>
  }

  const _default: { GarminConnect: typeof GarminConnect }
  export default _default
}
