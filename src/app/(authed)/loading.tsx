import { Box, CircularProgress } from '@mui/material'
import React from 'react'

export default function Loading() {
  return (
    <Box className='flex h-screen w-full items-center justify-center bg-[#001e2b]'>
        <CircularProgress sx={{ color: '#dad7cd' }} />
    </Box>
  )
}
