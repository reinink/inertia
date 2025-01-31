import { useEffect, useState } from 'react'
import { Head, router } from '@inertiajs/react'
import Layout from '../Components/Layout'
import TestGrid from '../Components/TestGrid'
import TestGridItem from '../Components/TestGridItem'

const Poll = ({ users, companies }) => {
    const [userPollCount, setUserPollCount] = useState(0)
    const [hookPollCount, setHookPollCount] = useState(0)
    const [companyPollCount, setCompanyPollCount] = useState(0)

    const triggerAsyncRedirect = () => {
        router.get('/elsewhere', {}, {
            only: ['something'],
            async: true,
        })
    }

    useEffect(() => {
        const startHookPolling = () => {
            const interval = setInterval(() => {
                setHookPollCount(prev => prev + 1)
            }, 2000)
            return () => clearInterval(interval)
        }

        const stopUserPolling = () => {
            const interval = setInterval(() => {
                setUserPollCount(prev => prev + 1)
            }, 1000)
            setTimeout(() => {
                clearInterval(interval)
                console.log('stopping user polling')
            }, 3000)
        }

        setTimeout(() => {
            startHookPolling()
        }, 2000)

        stopUserPolling()
    }, [])

    return (
        <>
            <Head title="Async Request" />
            <h1 className="text-3xl">Poll</h1>
            <TestGrid>
                <TestGridItem>
                    <div>User Poll Request Count: {userPollCount}</div>
                    {users.map((user, index) => (
                        <div key={index}>{user}</div>
                    ))}
                </TestGridItem>
                <TestGridItem>
                    <div>Companies Poll Request Count: {companyPollCount}</div>
                    {companies.map((company, index) => (
                        <div key={index}>{company}</div>
                    ))}
                </TestGridItem>
                <TestGridItem>
                    <div>Hook Poll Request Count: {hookPollCount}</div>
                </TestGridItem>
                <TestGridItem>
                    <button onClick={triggerAsyncRedirect}>Trigger Async Redirect</button>
                </TestGridItem>
            </TestGrid>
        </>
    )
}

Poll.layout = page => <Layout children={page} />

export default Poll
