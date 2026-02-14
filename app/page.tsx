import GuestLayout from '@/app/GuestLayout';
import Landing from '@/src/components/Landing';
import React from 'react';

const Home: React.FC = () => {

  return(
    <GuestLayout children={<Landing/>}/>


 )
}

export default Home;