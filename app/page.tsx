import GuestLayout from '@/app/GuestLayout';
import Landing from '@/components/Landing';
import React from 'react';

const Home: React.FC = () => {

  return(
    <GuestLayout children={<Landing/>}/>


 )
}

export default Home;