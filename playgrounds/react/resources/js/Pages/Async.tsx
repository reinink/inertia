import { Head } from '@inertiajs/react'
import Layout from '../Components/Layout'

const Async = ({
                   sleep,
                   jonathan,
                   taylor,
                   joe,
               }: {
    sleep?: boolean
    jonathan?: boolean
    taylor?: boolean
    joe?: boolean
}) => {
    return (
        <>
            <Head title="Async" />
            <h1 className="text-3xl">Async</h1>
            <div className="mt-6 rounded border border-yellow-500 bg-yellow-200 p-4">
                <p>Page is loaded!</p>
            </div>

            <div className="mt-6 flex space-x-6">
                <div className="w-1/2 rounded border border-black p-4">
                    <p>Sleep: {sleep ? 'Yes' : 'No'}</p>
                </div>

                <div className="w-1/2 rounded border border-black p-4">
                    <p>Jonathan: {jonathan ? 'Yes' : 'No'}</p>
                </div>

                <div className="w-1/2 rounded border border-black p-4">
                    <p>Taylor: {taylor ? 'Yes' : 'No'}</p>
                </div>

                <div className="w-1/2 rounded border border-black p-4">
                    <p>Joe: {joe ? 'Yes' : 'No'}</p>
                </div>
            </div>
        </>
    )
}

Async.layout = (page) => <Layout children={page} />

export default Async
