"use client"
import GuestLayout from '@/app/GuestLayout';
import {Landing} from '@/components/Landing';
import React from 'react';
import { HeroUIProvider } from "@heroui/react";


const Home: React.FC = () => {


  return(
    <HeroUIProvider>
      <GuestLayout children={<Landing />} />
    </HeroUIProvider>
 )
}

export default Home;