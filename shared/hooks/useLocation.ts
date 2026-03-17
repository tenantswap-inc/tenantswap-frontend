"use server"
import { Client } from '@/shared/utils/LocationClient';


export const getStates = async () => {

      const response = await Client.get(`countries/NG/states`);
      return response.data;

}

export const getCity = async (state: string) => {

}