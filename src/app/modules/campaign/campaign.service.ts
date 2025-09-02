/* eslint-disable @typescript-eslint/no-explicit-any */
import { endOfDay, isValid, parseISO, startOfDay } from 'date-fns';
import {
  CampaignFilters,
  CampaignOverviewStats,
  CampaignSearchQuery,
  ChartDataItem,
} from './campaign.interface';
import { CampaignModel } from './campaign.model';
import { monthMap, monthNumberMap } from './utils/utils';

const getCampaignsWithPaginationFromDB = async (
  page: number,
  limit: number,
  searchQuery: CampaignSearchQuery
) => {
  const query: {
    $or?: Array<{ [key: string]: string | RegExp }>;
    dateOfIncorporation?: any;
    funnelStatus?: any;
  } = {};

  if (searchQuery.directorName) {
    query['$or'] = [
      { directorFirstName: new RegExp(searchQuery.directorName, 'i') },
      { directorLastName: new RegExp(searchQuery.directorName, 'i') },
    ];
  }

  if (searchQuery.companyName) {
    query['$or'] = [
      ...(query['$or'] || []),
      { companyName: new RegExp(searchQuery.companyName, 'i') },
    ];
  }

  if (searchQuery.directorEmail) {
    query['$or'] = [...(query['$or'] || []), { directorEmail: searchQuery.directorEmail }];
  }

  if (searchQuery.companyCIN) {
    query['$or'] = [...(query['$or'] || []), { companyCIN: searchQuery.companyCIN }];
  }

  if (searchQuery.directorDIN) {
    query['$or'] = [...(query['$or'] || []), { directorDIN: searchQuery.directorDIN }];
  }

  if (searchQuery.funnelStatus) {
    query.funnelStatus = searchQuery.funnelStatus;
  }

  if (searchQuery.dateOfIncorporation) {
    const date = parseISO(searchQuery.dateOfIncorporation);
    if (isValid(date)) {
      query['dateOfIncorporation'] = {
        $gte: startOfDay(date),
        $lte: endOfDay(date),
      };
    }
  } else if (searchQuery.startDate && searchQuery.endDate) {
    const startDate = parseISO(searchQuery.startDate);
    const endDate = parseISO(searchQuery.endDate);

    if (isValid(startDate) && isValid(endDate)) {
      query['dateOfIncorporation'] = {
        $gte: startOfDay(startDate),
        $lte: endOfDay(endDate),
      };
    }
  }

  const sortOption = searchQuery.sort === 'desc' ? -1 : 1;

  const campaigns = await CampaignModel.find(query)
    .select(
      '_id companyCIN companyName dateOfIncorporation directorFirstName directorLastName directorEmail directorDIN funnelStatus campaigns createdAt'
    )
    .sort({ dateOfIncorporation: sortOption })
    .skip((page - 1) * limit)
    .limit(limit);

  const totalCampaigns = await CampaignModel.countDocuments(query);

  return {
    campaigns,
    totalCampaigns,
    totalPages: Math.ceil(totalCampaigns / limit),
    currentPage: page,
  };
};

const getCampaignsTrackerForDashboardFromDB = async (
  page = 1,
  limit = 10,
  statusCategory = 'upcoming',
  filters: CampaignFilters = {},
  sortField?: 'scheduledDate' | 'sentDate' | 'dateOfIncorporation',
  sortOrder: 'asc' | 'desc' = 'desc'
) => {
  const skip = (page - 1) * limit;
  const today = new Date();

  const matchStage: any = {};

  const orConditions: any[] = [];

  if (filters.directorName) {
    orConditions.push(
      { directorFirstName: { $regex: filters.directorName, $options: 'i' } },
      { directorLastName: { $regex: filters.directorName, $options: 'i' } }
    );
  }
  if (filters.companyName) {
    orConditions.push({ companyName: { $regex: filters.companyName, $options: 'i' } });
  }
  if (filters.companyCIN) {
    orConditions.push({ companyCIN: { $regex: filters.companyCIN, $options: 'i' } });
  }
  if (filters.directorDIN) {
    orConditions.push({ directorDIN: { $regex: filters.directorDIN, $options: 'i' } });
  }
  if (filters.directorEmail) {
    orConditions.push({ directorEmail: { $regex: filters.directorEmail, $options: 'i' } });
  }

  if (orConditions.length > 0) {
    matchStage.$or = orConditions;
  }

  // Incorporation Date Filter (company level)
  if (filters.incorporationStartDate && filters.incorporationEndDate) {
    const start = parseISO(filters.incorporationStartDate);
    const end = parseISO(filters.incorporationEndDate);
    if (isValid(start) && isValid(end)) {
      matchStage.dateOfIncorporation = {
        $gte: startOfDay(start),
        $lte: endOfDay(end),
      };
    }
  }

  // Determine sort field and order for $facet paginated stage
  const sortFieldMap = {
    scheduledDate: 'campaigns.scheduledDate',
    sentDate: 'campaigns.sentDate',
    dateOfIncorporation: 'dateOfIncorporation',
  };

  const mongoSortField = sortField ? sortFieldMap[sortField] : undefined;
  const sortBy: Record<string, 1 | -1> = {};
  if (mongoSortField) {
    sortBy[mongoSortField] = sortOrder === 'asc' ? 1 : -1;
  }

  const companies = await CampaignModel.aggregate([
    { $match: matchStage },

    // Flatten campaigns
    { $unwind: '$campaigns' },

    // Add status type field
    {
      $addFields: {
        statusType: {
          $cond: [
            { $eq: ['$campaigns.status', 'sent'] },
            'sent',
            {
              $cond: [{ $gt: ['$campaigns.scheduledDate', today] }, 'upcoming', 'overdue'],
            },
          ],
        },
      },
    },

    // Apply schedule date range filter
    ...(filters.scheduledStartDate && filters.scheduledEndDate
      ? [
          {
            $match: {
              'campaigns.scheduledDate': {
                $gte: startOfDay(parseISO(filters.scheduledStartDate)),
                $lte: endOfDay(parseISO(filters.scheduledEndDate)),
              },
            },
          },
        ]
      : []),

    // Apply sent date range filter
    ...(filters.sentStartDate && filters.sentEndDate
      ? [
          {
            $match: {
              'campaigns.sentDate': {
                $gte: startOfDay(parseISO(filters.sentStartDate)),
                $lte: endOfDay(parseISO(filters.sentEndDate)),
              },
            },
          },
        ]
      : []),

    {
      $facet: {
        paginated: [
          { $match: { statusType: statusCategory } },
          ...(mongoSortField ? [{ $sort: sortBy }] : []),
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              _id: 1,
              companyCIN: 1,
              companyName: 1,
              dateOfIncorporation: 1,
              directorDIN: 1,
              directorFirstName: 1,
              directorLastName: 1,
              directorEmail: 1,
              funnelStatus: 1,
              createdAt: 1,
              scheduledDate: '$campaigns.scheduledDate',
              sentDate: '$campaigns.sentDate',
              sentStatus: '$campaigns.status',
            },
          },
        ],
        upcomingTotal: [{ $match: { statusType: 'upcoming' } }, { $count: 'count' }],
        sentTotal: [{ $match: { statusType: 'sent' } }, { $count: 'count' }],
        overdueTotal: [{ $match: { statusType: 'overdue' } }, { $count: 'count' }],
        statusCategoryTotal: [{ $match: { statusType: statusCategory } }, { $count: 'count' }],
      },
    },
  ]);

  const data = companies[0];

  return {
    campaigns: data.paginated,
    totalNumberOfUpcomingCampaigns: data.upcomingTotal[0]?.count || 0,
    totalNumberOfRecentCampaigns: data.sentTotal[0]?.count || 0,
    totalNumberOfOverdueCampaigns: data.overdueTotal[0]?.count || 0,
    totalNumberOfUpcomingCampaignsPage: Math.ceil((data.upcomingTotal[0]?.count || 0) / limit),
    totalNumberOfRecentCampaignsPage: Math.ceil((data.sentTotal[0]?.count || 0) / limit),
    totalNumberOfOverdueCampaignsPage: Math.ceil((data.overdueTotal[0]?.count || 0) / limit),
    currentUpcomingCampaignsPage: statusCategory === 'upcoming' ? page : 1,
    currentRecentCampaignsPage: statusCategory === 'sent' ? page : 1,
    currentOverdueCampaignsPage: statusCategory === 'overdue' ? page : 1,
  };
};

const getCampaignOverviewStatsFromDB = async (
  selectedYear?: string,
  selectedMonth?: string
): Promise<CampaignOverviewStats> => {
  const matchStages: any[] = [];

  // Filter by year if applicable
  if (selectedYear && selectedYear !== 'All Year') {
    const yearNum = parseInt(selectedYear);
    const start = new Date(yearNum, 0, 1);
    const end = new Date(yearNum + 1, 0, 1);
    matchStages.push({
      'campaigns.scheduledDate': { $gte: start, $lt: end },
    });

    // Filter by month if applicable
    if (selectedMonth && selectedMonth !== 'All Month') {
      const monthNum = monthNumberMap[selectedMonth];
      const startOfMonth = new Date(yearNum, monthNum, 1);
      const endOfMonth = new Date(yearNum, monthNum + 1, 1);

      matchStages.push({
        'campaigns.scheduledDate': { $gte: startOfMonth, $lt: endOfMonth },
      });
    }
  }

  // Determine the date format based on year/month selection
  const dateFormat =
    selectedYear && selectedYear !== 'All Year'
      ? selectedMonth && selectedMonth !== 'All Month'
        ? '%d' // Day view
        : '%m' // Month view
      : '%Y'; // Year view

  // Aggregation query to fetch data
  const aggregation = await CampaignModel.aggregate([
    { $unwind: '$campaigns' },
    ...(matchStages.length ? [{ $match: { $and: matchStages } }] : []),
    {
      $facet: {
        counts: [
          {
            $group: {
              _id: '$campaigns.status',
              count: { $sum: 1 },
            },
          },
        ],
        chart: [
          {
            $addFields: {
              period: {
                $dateToString: {
                  format: dateFormat,
                  date: '$campaigns.scheduledDate',
                },
              },
            },
          },
          {
            $group: {
              _id: '$period',
              pending: {
                $sum: {
                  $cond: [{ $eq: ['$campaigns.status', 'pending'] }, 1, 0],
                },
              },
              sent: {
                $sum: {
                  $cond: [{ $eq: ['$campaigns.status', 'sent'] }, 1, 0],
                },
              },
              total: { $sum: 1 },
            },
          },
          {
            $project: {
              _id: 0,
              period: '$_id',
              pending: 1,
              sent: 1,
              total: 1,
            },
          },
        ],
        meta: [
          {
            $group: {
              _id: null,
              totalCompanies: { $addToSet: '$companyCIN' },
              totalDirectors: { $addToSet: '$_id' },
              activeCompanies: {
                $addToSet: {
                  $cond: [{ $eq: ['$funnelStatus', 'active'] }, '$companyCIN', null],
                },
              },
              activeDirectors: {
                $addToSet: {
                  $cond: [{ $eq: ['$funnelStatus', 'active'] }, '$_id', null],
                },
              },
            },
          },
          {
            $project: {
              totalCompanies: { $size: '$totalCompanies' },
              totalDirectors: {
                $size: {
                  $filter: {
                    input: '$totalDirectors',
                    as: 'd',
                    cond: { $ne: ['$$d', null] },
                  },
                },
              },
              activeFunnelCompanies: {
                $size: {
                  $filter: {
                    input: '$activeCompanies',
                    as: 'c',
                    cond: { $ne: ['$$c', null] },
                  },
                },
              },
              activeFunnelDirectors: {
                $size: {
                  $filter: {
                    input: '$activeDirectors',
                    as: 'd',
                    cond: { $ne: ['$$d', null] },
                  },
                },
              },
            },
          },
        ],
      },
    },
  ]);

  // Extract counts, chart data, and meta data
  const counts = aggregation[0]?.counts || [];
  const rawChartData = aggregation[0]?.chart || [];
  const meta = aggregation[0]?.meta?.[0] || {};

  // Map raw chart data to display months correctly
  const chartData: ChartDataItem[] = rawChartData.map((item: any) => {
    if (dateFormat === '%m') {
      return {
        ...item,
        period: monthMap[item.period] || item.period,
      };
    }
    return item;
  });

  // Sorting logic based on the selected date format
  if (dateFormat === '%Y' || dateFormat === '%d') {
    chartData.sort((a: any, b: any) => parseInt(a.period) - parseInt(b.period));
  } else if (dateFormat === '%m') {
    const monthOrder = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    chartData.sort((a: any, b: any) => monthOrder.indexOf(a.period) - monthOrder.indexOf(b.period));
  }

  // Prepare campaign status data
  const campaignStatusData = [
    { name: 'Pending', value: counts.find((c: any) => c._id === 'pending')?.count || 0 },
    { name: 'Sent', value: counts.find((c: any) => c._id === 'sent')?.count || 0 },
  ];

  return {
    totalCompanies: meta.totalCompanies || 0,
    totalDirectors: meta.totalDirectors || 0,
    activeFunnelCompanies: meta.activeFunnelCompanies || 0,
    activeFunnelDirectors: meta.activeFunnelDirectors || 0,
    pendingCampaignCount: campaignStatusData[0].value,
    sentCampaignCount: campaignStatusData[1].value,
    campaignStatusData,
    chartData,
  };
};

const getCampaignReportFromDB = async (
  selectedYear?: string,
  selectedMonth?: string,
  xAxis: 'incDate' | 'scheduleDate' = 'incDate',
  yAxis: 'company' | 'director' = 'company'
) => {
  const matchStages: any[] = [];

  // Convert year/month to date range
  if (selectedYear && selectedYear !== 'All Year') {
    const year = parseInt(selectedYear);
    const start = new Date(year, 0, 1);
    const end = new Date(year + 1, 0, 1);
    matchStages.push({
      [xAxis === 'incDate' ? 'dateOfIncorporation' : 'campaigns.scheduledDate']: {
        $gte: start,
        $lt: end,
      },
    });

    if (selectedMonth && selectedMonth !== 'All Month') {
      const month = monthNumberMap[selectedMonth];
      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 1);
      matchStages.push({
        [xAxis === 'incDate' ? 'dateOfIncorporation' : 'campaigns.scheduledDate']: {
          $gte: startOfMonth,
          $lt: endOfMonth,
        },
      });
    }
  }

  const pipeline: any[] = [];

  if (xAxis === 'scheduleDate') {
    pipeline.push({ $unwind: '$campaigns' });
  }

  if (matchStages.length > 0) {
    pipeline.push({ $match: { $and: matchStages } });
  }

  const dateField = xAxis === 'incDate' ? '$dateOfIncorporation' : '$campaigns.scheduledDate';
  const idField = yAxis === 'director' ? '$_id' : '$companyCIN';

  pipeline.push(
    {
      $addFields: {
        period:
          selectedMonth && selectedMonth !== 'All Month'
            ? { $dateToString: { format: '%d', date: dateField } }
            : selectedYear && selectedYear !== 'All Year'
              ? { $dateToString: { format: '%m', date: dateField } }
              : { $dateToString: { format: '%Y', date: dateField } },
      },
    },
    {
      $group: {
        _id: '$period',
        uniqueItems: { $addToSet: idField },
      },
    },
    {
      $project: {
        _id: 0,
        period: '$_id',
        value: { $size: '$uniqueItems' },
      },
    }
  );

  const result = await CampaignModel.aggregate(pipeline);

  // If grouping by month name, convert '01' to 'Jan' etc.
  if (
    selectedYear &&
    selectedYear !== 'All Year' &&
    (!selectedMonth || selectedMonth === 'All Month')
  ) {
    result.forEach(item => (item.period = monthMap[item.period] || item.period));

    const order = Object.values(monthMap);
    result.sort((a, b) => order.indexOf(a.period) - order.indexOf(b.period));
  } else {
    result.sort((a, b) => parseInt(a.period) - parseInt(b.period));
  }

  return result;
};

export const CampaignService = {
  getCampaignsWithPaginationFromDB,
  getCampaignsTrackerForDashboardFromDB,
  getCampaignOverviewStatsFromDB,
  getCampaignReportFromDB,
};
