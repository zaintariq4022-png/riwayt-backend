const express = require('express');
const router = express.Router();
const { BetaAnalyticsDataClient } = require('@google-analytics/data');

const GA4_PROPERTY_ID = 'properties/533619980';

function getAnalyticsClient() {
  const creds = JSON.parse(process.env.GA4_SERVICE_ACCOUNT_JSON || '{}');
  if (!creds.client_email) return null;
  return new BetaAnalyticsDataClient({ credentials: creds });
}

router.get('/', async (req, res) => {
  try {
    const client = getAnalyticsClient();
    if (!client) {
      return res.json({ success: false, message: 'GA4 not configured' });
    }

    const days = parseInt(req.query.days) || 7;
    const dateRange = { startDate: `${days}daysAgo`, endDate: 'today' };

    // Run all reports in parallel
    const [
      overviewRes,
      dailyRes,
      deviceRes,
      cityRes,
      sourceRes,
      pageRes,
    ] = await Promise.all([

      // Overview — total visitors, sessions
      client.runReport({
        property: GA4_PROPERTY_ID,
        dateRanges: [dateRange],
        metrics: [
          { name: 'activeUsers' },
          { name: 'sessions' },
          { name: 'screenPageViews' },
          { name: 'averageSessionDuration' },
        ],
      }),

      // Daily visitors
      client.runReport({
        property: GA4_PROPERTY_ID,
        dateRanges: [dateRange],
        dimensions: [{ name: 'date' }],
        metrics: [{ name: 'activeUsers' }, { name: 'screenPageViews' }],
        orderBys: [{ dimension: { dimensionName: 'date' } }],
      }),

      // Device breakdown
      client.runReport({
        property: GA4_PROPERTY_ID,
        dateRanges: [dateRange],
        dimensions: [{ name: 'deviceCategory' }],
        metrics: [{ name: 'activeUsers' }],
      }),

      // Top cities
      client.runReport({
        property: GA4_PROPERTY_ID,
        dateRanges: [dateRange],
        dimensions: [{ name: 'city' }],
        metrics: [{ name: 'activeUsers' }],
        orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
        limit: 6,
      }),

      // Traffic sources
      client.runReport({
        property: GA4_PROPERTY_ID,
        dateRanges: [dateRange],
        dimensions: [{ name: 'sessionDefaultChannelGroup' }],
        metrics: [{ name: 'sessions' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 5,
      }),

      // Top pages
      client.runReport({
        property: GA4_PROPERTY_ID,
        dateRanges: [dateRange],
        dimensions: [{ name: 'pageTitle' }],
        metrics: [{ name: 'screenPageViews' }],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: 5,
      }),
    ]);

    // Parse overview
    const ov = overviewRes[0]?.rows?.[0]?.metricValues || [];
    const totalVisitors = parseInt(ov[0]?.value || 0);
    const totalSessions = parseInt(ov[1]?.value || 0);
    const totalPageviews = parseInt(ov[2]?.value || 0);
    const avgSecs = parseInt(ov[3]?.value || 0);
    const avgTime = `${Math.floor(avgSecs/60)}m ${avgSecs%60}s`;

    // Parse daily
    const daily = (dailyRes[0]?.rows || []).map(r => {
      const d = r.dimensionValues[0].value;
      return {
        label: `${d.slice(4,6)}/${d.slice(6,8)}`,
        visitors: parseInt(r.metricValues[0].value),
        pageviews: parseInt(r.metricValues[1].value),
      };
    });

    // Parse devices
    const devices = {};
    (deviceRes[0]?.rows || []).forEach(r => {
      devices[r.dimensionValues[0].value] = parseInt(r.metricValues[0].value);
    });

    // Parse cities
    const cities = (cityRes[0]?.rows || []).map(r => ({
      city: r.dimensionValues[0].value,
      visitors: parseInt(r.metricValues[0].value),
    }));

    // Parse sources
    const sources = {};
    (sourceRes[0]?.rows || []).forEach(r => {
      sources[r.dimensionValues[0].value] = parseInt(r.metricValues[0].value);
    });

    // Parse pages
    const topPages = (pageRes[0]?.rows || []).map(r => ({
      page: r.dimensionValues[0].value,
      views: parseInt(r.metricValues[0].value),
    }));

    res.json({
      success: true,
      data: {
        totalVisitors, totalSessions, totalPageviews, avgTime,
        daily, devices, cities, sources, topPages,
        topProducts: [], // GA4 se product views alag event se aate hain
      }
    });

  } catch(err) {
    console.error('GA4 Analytics error:', err.message);
    res.json({ success: false, message: err.message });
  }
});

module.exports = router;
