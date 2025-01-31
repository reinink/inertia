import React from 'react'

const TestGrid = ({ children }) => {
    return (
        <div className="mt-6 grid grid-cols-3 gap-4">
            {children}
        </div>
    )
}

export default TestGrid
