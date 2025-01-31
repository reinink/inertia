import React from 'react'

const TestGridItem = ({ children, title }) => {
    return (
        <div className="rounded border border-gray-300 p-4 text-sm text-gray-500">
            {title && (
                <div className="mb-2 font-bold">
                    {title}
                </div>
            )}
            {children}
        </div>
    )
}

export default TestGridItem
