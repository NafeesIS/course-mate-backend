import { Router } from 'express';
import { AcademyRoutes } from '../modules/academy/academy.router';
import { ApiKeyRoutes } from '../modules/apiKey/apiKey.route';
import { CompanyRoutes } from '../modules/company/company.route';

import { DirectorRoutes } from '../modules/director/director.route';

import { CampaignRoutes } from '../modules/campaign/campaign.route';
import { CouponRoutes } from '../modules/coupon/coupon.route';
import { CreditRoutes } from '../modules/credits/credit.route';
import { DocRoutes } from '../modules/docs/doc.route';
import { FeedbackRoutes } from '../modules/feedback/feedback.route';
import { InsightsRoutes } from '../modules/insights/insights.route';
import { LeadGenRoutes } from '../modules/leadGeneration/leadGen.route';
import { MailchimpRoutes } from '../modules/mailchimp/mailchimp.route';
import { TeamMemberRoutes } from '../modules/meetOurTeam/team.route';
import { OrderRoutes } from '../modules/order/order.route';
import { PartnerRoutes } from '../modules/partner/partner.route';
import { ServiceCatalogRoutes } from '../modules/serviceCatalog/serviceCatalog.route';
import { SitemapRoutes } from '../modules/sitemap/sitemap.route';
import { SubscriptionRoutes } from '../modules/subscription/subscription.route';
import { TransactionsRoute } from '../modules/transactions/transactions.route';
import { UnlockCompanyRoutes } from '../modules/unlockCompany/unlockCompany.route';
import { UnlockContactRoutes } from '../modules/unlockContact/unlockContact.route';
import { UserRoutes } from '../modules/user/user.route';
import { VpdAnalysisRoutes } from '../modules/vpdAnalysis/vpdAnalysis.route';
import { WebhooksRoutes } from '../modules/webhooks/webhooks.route';
import { ZohoCrmRoutes } from '../modules/zoho/zoho.route';

const router = Router();

//add new route in here
const moduleRoutes = [
  {
    path: '/api-keys',
    route: ApiKeyRoutes,
  },
  {
    path: '/companies',
    route: CompanyRoutes,
  },

  {
    path: '/directors',
    route: DirectorRoutes,
  },
  {
    path: '/partners',
    route: PartnerRoutes,
  },

  {
    path: '/vpdAnalysis',
    route: VpdAnalysisRoutes,
  },
  {
    path: '/academy',
    route: AcademyRoutes,
  },
  {
    path: '/sitemaps',
    route: SitemapRoutes,
  },
  {
    path: '/leads',
    route: LeadGenRoutes,
  },
  {
    path: '/mailchimp',
    route: MailchimpRoutes,
  },
  {
    path: '/team',
    route: TeamMemberRoutes,
  },
  {
    path: '/insights',
    route: InsightsRoutes,
  },
  {
    path: '/transactions',
    route: TransactionsRoute,
  },
  {
    path: '/orders',
    route: OrderRoutes,
  },
  {
    path: '/crm',
    route: ZohoCrmRoutes,
  },
  {
    path: '/users',
    route: UserRoutes,
  },
  {
    path: '/campaigns',
    route: CampaignRoutes,
  },
  {
    path: '/service-catalog',
    route: ServiceCatalogRoutes,
  },
  {
    path: '/subscribe',
    route: SubscriptionRoutes,
  },
  {
    path: '/credits',
    route: CreditRoutes,
  },
  {
    path: '/unlock-contact',
    route: UnlockContactRoutes,
  },
  {
    path: '/unlock-company',
    route: UnlockCompanyRoutes,
  },
  {
    path: '/coupon',
    route: CouponRoutes,
  },
  {
    path: '/webhooks',
    route: WebhooksRoutes,
  },
  {
    path: '/docs',
    route: DocRoutes,
  },
  {
    path: '/feedback',
    route: FeedbackRoutes,
  },
];

moduleRoutes.forEach(route => {
  router.use(route.path, route.route);
});

export default router;
