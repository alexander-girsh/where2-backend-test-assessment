const Express = require('express')
const {config} = require('./config.js')
const {getMatchingFlights} = require('/flights.js')

const app = Express()

const router = Express.Router()

app.use(router)

router.get('/matching-flights', async (req, res) => {

    try {

        const {
            max_acceptable_flight_duration_hours,
            min_acceptable_departure_datetime,
            max_acceptable_departure_datetime,
            preferred_carrier_name
        } = req.query


        const matching_flights_searching_result = await getMatchingFlights({
            max_acceptable_flight_duration_hours,
            min_acceptable_departure_datetime,
            max_acceptable_departure_datetime,
            preferred_carrier_name
        })

        return res.json(matching_flights_searching_result)


    } catch (e) {

        const {query, body, headers} = req

        console.error(e, {
            context: {
                query,
                body,
                headers
            }
        })

        return res.status(500).json({
            status: 'INTERNAL_ERROR'
        })
    }
})

app.listen(config.HTTP_SERVER_PORT, () => {
    console.log(`server listening on :${config.HTTP_SERVER_PORT}`)
})