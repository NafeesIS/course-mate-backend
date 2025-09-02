import httpStatus from 'http-status';
import { SessionRequest } from 'supertokens-node/framework/express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { CampaignService } from './campaign.service';

const getCampaignsWithPagination = catchAsync(async (req: SessionRequest, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const companyName = typeof req.query.companyName === 'string' ? req.query.companyName : undefined;
  const directorName =
    typeof req.query.directorName === 'string' ? req.query.directorName : undefined;
  const directorEmail =
    typeof req.query.directorEmail === 'string' ? req.query.directorEmail : undefined;
  const funnelStatus =
    typeof req.query.funnelStatus === 'string' ? req.query.funnelStatus : undefined;
  const companyCIN = typeof req.query.companyCIN === 'string' ? req.query.companyCIN : undefined;
  const directorDIN = typeof req.query.directorDIN === 'string' ? req.query.directorDIN : undefined;
  const dateOfIncorporation =
    typeof req.query.dateOfIncorporation === 'string' ? req.query.dateOfIncorporation : undefined;
  const startDate = typeof req.query.startDate === 'string' ? req.query.startDate : undefined;
  const endDate = typeof req.query.endDate === 'string' ? req.query.endDate : undefined;
  const sort = req.query.sort === 'desc' ? 'desc' : 'asc'; // Default to ascending

  const result = await CampaignService.getCampaignsWithPaginationFromDB(
    Number(page),
    Number(limit),
    {
      companyName,
      directorName,
      directorEmail,
      companyCIN,
      directorDIN,
      dateOfIncorporation,
      funnelStatus,
      startDate,
      endDate,
      sort,
    }
  );

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Campaigns fetched successfully.',
    data: result,
  });
});

const getCampaignsTrackerForDashboard = catchAsync(async (req: SessionRequest, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;

  const statusCategory =
    req.query.statusCategory === 'sent' ||
    req.query.statusCategory === 'overdue' ||
    req.query.statusCategory === 'upcoming'
      ? req.query.statusCategory
      : 'upcoming';

  const incorporationStartDate =
    typeof req.query.incorporationStartDate === 'string'
      ? req.query.incorporationStartDate
      : undefined;

  const incorporationEndDate =
    typeof req.query.incorporationEndDate === 'string' ? req.query.incorporationEndDate : undefined;

  const scheduledStartDate =
    typeof req.query.scheduledStartDate === 'string' ? req.query.scheduledStartDate : undefined;

  const scheduledEndDate =
    typeof req.query.scheduledEndDate === 'string' ? req.query.scheduledEndDate : undefined;

  const sentStartDate =
    typeof req.query.sentStartDate === 'string' ? req.query.sentStartDate : undefined;

  const sentEndDate = typeof req.query.sentEndDate === 'string' ? req.query.sentEndDate : undefined;
  const companyName = typeof req.query.companyName === 'string' ? req.query.companyName : undefined;
  const directorName =
    typeof req.query.directorName === 'string' ? req.query.directorName : undefined;
  const directorEmail =
    typeof req.query.directorEmail === 'string' ? req.query.directorEmail : undefined;
  const companyCIN = typeof req.query.companyCIN === 'string' ? req.query.companyCIN : undefined;
  const directorDIN = typeof req.query.directorDIN === 'string' ? req.query.directorDIN : undefined;
  const sortField =
    req.query.sortField === 'scheduledDate' ||
    req.query.sortField === 'sentDate' ||
    req.query.sortField === 'dateOfIncorporation'
      ? req.query.sortField
      : undefined;

  const sortOrder =
    req.query.sortOrder === 'desc' || req.query.sortOrder === 'asc' ? req.query.sortOrder : 'desc';

  const result = await CampaignService.getCampaignsTrackerForDashboardFromDB(
    page,
    limit,
    statusCategory,
    {
      incorporationStartDate,
      incorporationEndDate,
      scheduledStartDate,
      scheduledEndDate,
      sentStartDate,
      sentEndDate,
      companyName,
      directorName,
      directorEmail,
      companyCIN,
      directorDIN,
    },
    sortField,
    sortOrder
  );

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Campaigns fetched successfully.',
    data: result,
  });
});
const getCampaignOverviewStatsController = catchAsync(async (req: SessionRequest, res) => {
  const selectedYear =
    typeof req.query.selectedYear === 'string' ? req.query.selectedYear : 'All Year';
  const selectedMonth =
    typeof req.query.selectedMonth === 'string' ? req.query.selectedMonth : 'All Month';

  const result = await CampaignService.getCampaignOverviewStatsFromDB(selectedYear, selectedMonth);

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Campaign overview stats fetched successfully.',
    data: result,
  });
});
const getCampaignReportController = catchAsync(async (req: SessionRequest, res) => {
  const selectedYear =
    typeof req.query.selectedYear === 'string' ? req.query.selectedYear : undefined;
  const selectedMonth =
    typeof req.query.selectedMonth === 'string' ? req.query.selectedMonth : undefined;
  const xAxis = req.query.xAxis === 'scheduleDate' ? 'scheduleDate' : 'incDate';
  const yAxis = req.query.yAxis === 'director' ? 'director' : 'company';

  const result = await CampaignService.getCampaignReportFromDB(
    selectedYear,
    selectedMonth,
    xAxis,
    yAxis
  );

  res.status(200).json({
    success: true,
    message: 'Campaign XY stats fetched successfully.',
    data: result,
  });
});

export const CampaignController = {
  getCampaignsWithPagination,
  getCampaignsTrackerForDashboard,
  getCampaignOverviewStatsController,
  getCampaignReportController,
};
