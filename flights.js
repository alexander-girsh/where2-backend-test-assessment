/**
 * @typedef {Object} FlightMetaData
 * @property {Date|String} departureTime
 * @property {Date|String} arrivalTime
 * @property {String} carrier
 * @property {String} origin
 * @property {String} destination
 */

/**
 * @typedef {Object} ScoredFlightMetaData
 * @extends FlightMetaData
 * @property {Number} score
 */

const axios = require('axios')
const {config} = require('./config.js')

async function fetchFlightsList () {
    try {

        return await axios.get(config.FLIGHTS_LIST_DATA_SOURCE_URL)
            .then(r => r.data)
            .then(raw_data => JSON.parse(raw_data))

    } catch (e) {
        console.error(e)
        // some error handling
        throw e
    }
}

function calcFlightDuration (departure_time, arrival_time) {
    const flight_duration_ms = new Date(Date.parse(arrival_time)).getTime() -
        new Date(Date.parse(departure_time)).getTime()

    const flight_duration_hours = Math.trunc((flight_duration_ms / 1000) / 3600)

    return flight_duration_hours
}

/**
 *
 * @param {FlightMetaData.carrier} flight_metadata
 * @param {String} preferred_carrier_name
 * @returns {Boolean}
 */
function isManagedByPreferredCarrier (flight_metadata, preferred_carrier_name) {
    return Boolean(flight_metadata.carrier === preferred_carrier_name)
}

/**
 *
 * @param {FlightMetaData[]} flights_metadata
 * @param {String} preferred_carrier_name
 * @return {ScoredFlightMetaData[]}
 */
function scoreFlights (flights_metadata, preferred_carrier_name) {
    flights_metadata.map(flight_metadata => ({
     ...flight_metadata,
     score: (() => {
         const flight_duration_in_hours = calcFlightDuration(
             flight_metadata.departureTime,
             flight_metadata.arrivalTime
         )

         const is_managed_by_preferred_carrier = isManagedByPreferredCarrier(
             flight_metadata.carrier,
             preferred_carrier_name
         )

         const distance_between_airports_miles = getDistanceBetweenAirports(
             flight_metadata.origin,
             flight_metadata.destination
         )

         const score =  flight_duration_in_hours *
             (is_managed_by_preferred_carrier ? 0.9 : 1)
             + distance_between_airports_miles

         return score

     })()

    }))
}

function filterFlightsByDepartureTimeRange (
    flights_metadata,
    min_acceptable_departure_datetime,
    max_acceptable_departure_datetime
) {

    const min_acceptable_departure_timestamp =
        new Date(Date.parse(min_acceptable_departure_datetime)).getTime()

    const max_acceptable_departure_timestamp =
        new Date(Date.parse(max_acceptable_departure_datetime)).getTime()


    return flights_metadata.filter(flight_metadata => {

        const departure_timestamp =
            new Date(Date.parse(flight_metadata.departureTime)).getTime()

        return (departure_timestamp >= min_acceptable_departure_timestamp &&
                departure_timestamp <= max_acceptable_departure_timestamp)
    })
}

/**
 *
 * @param {ScoredFlightMetaData[]} scored_flights
 * @returns {ScoredFlightMetaData[]}
 */
function sortFlightsByScore (scored_flights) {
    return scored_flights.sort((flight_a, flight_b) => {
        return flight_a.score - flight_b.score
    })
}

/**
 * @param {Number|String} max_acceptable_flight_duration_hours
 * @param {Date} min_acceptable_departure_datetime
 * @param {Date} max_acceptable_departure_datetime
 * @param {String} preferred_carrier_name
 * @returns {Promise<{flights: ScoredFlightMetaData[], status: string}|{status: string, desc: string}>}
 */
async function getMatchingFlights ({
                                       max_acceptable_flight_duration_hours,
                                       min_acceptable_departure_datetime,
                                       max_acceptable_departure_datetime,
                                       preferred_carrier_name
}) {
    try {

        if (!max_acceptable_flight_duration_hours ||
            isNaN(parseInt(max_acceptable_flight_duration_hours))) {
            return {
                status: 'WRONG_ARGS',
                desc: '.max_acceptable_flight_duration_hours should be a positive int'
            }
        }

        /* continuing params validation */

        const all_flights = await fetchFlightsList()

        const flights_acceptable_by_departure_datetime_range =
            filterFlightsByDepartureTimeRange(
                all_flights,
                min_acceptable_departure_datetime,
                max_acceptable_departure_datetime
            )

        const scored_flights = scoreFlights(
            flights_acceptable_by_departure_datetime_range,
            preferred_carrier_name
        )

        const acceptable_flights_sorted_by_score = sortFlightsByScore(scored_flights)

        return {
            status: 'OK',
            flights: acceptable_flights_sorted_by_score
        }


    } catch (e) {
        console.error(e)
        // some error handling
        throw e
    }
}

/**
 * @param {String} code1
 * @param {String} code2
 * @returns {Promise<Number>}
 */
async function getDistanceBetweenAirports (code1, code2) {
    return 1
}

module.exports = {
    getMatchingFlights
}


