/* eslint-disable quotes */
export const chargeDetailsAggregation = (cin: string) => {
  return [
    { $match: { cin } },

    {
      $project: {
        company: '$company',
        totalCharges: { $size: '$masterData.indexChargesData' },
        totalSatisfiedCharges: {
          $size: {
            $filter: {
              input: '$masterData.indexChargesData',
              as: 'charge',
              cond: { $eq: ['$$charge.chargeStatus', 'Closed'] },
            },
          },
        },
        totalChargeHolders: {
          $size: {
            $ifNull: [{ $setUnion: ['$masterData.indexChargesData.chargeHolderName'] }, []],
          },
        },
        satisfiedChargeHolders: {
          $size: {
            $ifNull: [
              {
                $setUnion: [
                  {
                    $map: {
                      input: {
                        $filter: {
                          input: '$masterData.indexChargesData',
                          as: 'charge',
                          cond: { $eq: ['$$charge.chargeStatus', 'Closed'] },
                        },
                      },
                      as: 'closedCharge',
                      in: '$$closedCharge.chargeHolderName',
                    },
                  },
                ],
              },
              [],
            ],
          },
        },
        openChargeHolders: {
          $size: {
            $ifNull: [
              {
                $setUnion: [
                  {
                    $map: {
                      input: {
                        $filter: {
                          input: '$masterData.indexChargesData',
                          as: 'charge',
                          cond: { $eq: ['$$charge.chargeStatus', 'Open'] },
                        },
                      },
                      as: 'openCharge',
                      in: '$$openCharge.chargeHolderName',
                    },
                  },
                ],
              },
              [],
            ],
          },
        },
        totalOpenChargeAmount: {
          $sum: {
            $map: {
              input: {
                $filter: {
                  input: '$masterData.indexChargesData',
                  as: 'charge',
                  cond: { $eq: ['$$charge.chargeStatus', 'Open'] },
                },
              },
              as: 'openCharge',
              in: { $toDouble: '$$openCharge.amount' },
            },
          },
        },
        totalSatisfiedChargeAmount: {
          $sum: {
            $map: {
              input: {
                $filter: {
                  input: '$masterData.indexChargesData',
                  as: 'charge',
                  cond: { $eq: ['$$charge.chargeStatus', 'Closed'] },
                },
              },
              as: 'closedCharge',
              in: { $toDouble: '$$closedCharge.amount' },
            },
          },
        },
        // Array of charges with specific fields
        chargesDetails: {
          $map: {
            input: '$masterData.indexChargesData',
            as: 'charge',
            in: {
              chargeHolderName: {
                $cond: [
                  { $eq: ['$$charge.chargeHolderName', ''] },
                  '-',
                  '$$charge.chargeHolderName',
                ],
              },
              status: {
                $cond: [{ $eq: ['$$charge.chargeStatus', ''] }, '-', '$$charge.chargeStatus'],
              },
              createdOn: {
                $cond: [{ $eq: ['$$charge.dateOfCreation', ''] }, '-', '$$charge.dateOfCreation'],
              },
              modifiedOn: {
                $cond: [
                  { $eq: ['$$charge.dateOfModification', ''] },
                  '-',
                  '$$charge.dateOfModification',
                ],
              },
              closedOn: {
                $cond: [
                  { $eq: ['$$charge.dateOfSatisfaction', ''] },
                  '-',
                  '$$charge.dateOfSatisfaction',
                ],
              },
              amount: { $toDouble: '$$charge.amount' },
            },
          },
        },
      },
    },

    {
      $addFields: {
        chargeOverview: {
          $concat: [
            'A "charge" is a legal claim on an asset used as security for a loan or obligation. This overview pertains to ',
            '$company',
            "'and its handling of such financial claims. Out of ",
            { $toString: '$totalCharges' },
            ' registered charges, ',
            { $toString: '$totalSatisfiedCharges' },
            ' have been satisfied, clearing the associated debts. Currently, ',
            '$company',
            ' has a total of ',
            { $toString: '$totalChargeHolders' },
            ' charge holders, with ',
            { $toString: '$satisfiedChargeHolders' },
            ' of these resolved. ',
            { $toString: '$openChargeHolders' },
            ' charge holders still have active claims, totaling approximately ',
            {
              $cond: [
                { $lt: ['$totalOpenChargeAmount', 10000000] },
                {
                  $concat: [
                    {
                      $arrayElemAt: [
                        {
                          $split: [
                            { $toString: { $divide: ['$totalOpenChargeAmount', 100000] } },
                            '.',
                          ],
                        },
                        0,
                      ],
                    },
                    '.',
                    {
                      $substr: [
                        {
                          $arrayElemAt: [
                            {
                              $split: [
                                { $toString: { $divide: ['$totalOpenChargeAmount', 100000] } },
                                '.',
                              ],
                            },
                            1,
                          ],
                        },
                        0,
                        2,
                      ],
                    },
                    ' lakhs',
                  ],
                },
                {
                  $concat: [
                    {
                      $arrayElemAt: [
                        {
                          $split: [
                            { $toString: { $divide: ['$totalOpenChargeAmount', 10000000] } },
                            '.',
                          ],
                        },
                        0,
                      ],
                    },
                    '.',
                    {
                      $substr: [
                        {
                          $arrayElemAt: [
                            {
                              $split: [
                                { $toString: { $divide: ['$totalOpenChargeAmount', 10000000] } },
                                '.',
                              ],
                            },
                            1,
                          ],
                        },
                        0,
                        2,
                      ],
                    },
                    ' crores',
                  ],
                },
              ],
            },
            '. Meanwhile, the value of resolved charges is ',
            {
              $cond: [
                { $lt: ['$totalSatisfiedChargeAmount', 10000000] },
                {
                  $concat: [
                    {
                      $arrayElemAt: [
                        {
                          $split: [
                            { $toString: { $divide: ['$totalSatisfiedChargeAmount', 100000] } },
                            '.',
                          ],
                        },
                        0,
                      ],
                    },
                    '.',
                    {
                      $substr: [
                        {
                          $arrayElemAt: [
                            {
                              $split: [
                                { $toString: { $divide: ['$totalSatisfiedChargeAmount', 100000] } },
                                '.',
                              ],
                            },
                            1,
                          ],
                        },
                        0,
                        2,
                      ],
                    },
                    ' lakhs',
                  ],
                },
                {
                  $concat: [
                    {
                      $arrayElemAt: [
                        {
                          $split: [
                            { $toString: { $divide: ['$totalSatisfiedChargeAmount', 10000000] } },
                            '.',
                          ],
                        },
                        0,
                      ],
                    },
                    '.',
                    {
                      $substr: [
                        {
                          $arrayElemAt: [
                            {
                              $split: [
                                {
                                  $toString: { $divide: ['$totalSatisfiedChargeAmount', 10000000] },
                                },
                                '.',
                              ],
                            },
                            1,
                          ],
                        },
                        0,
                        2,
                      ],
                    },
                    ' crores',
                  ],
                },
              ],
            },
            '. These figures represent ',
            '$company',
            "'s ongoing financial engagements and their resolution efficacy.",
          ],
        },
      },
    },
  ];
};
// Project needed fields and add new fields
// {
//   $project: {
//     // Calculate Total Charges Count
//     totalCharges: { $size: '$masterData.indexChargesData' },

//     // Calculate Satisfied Charges
//     totalSatisfiedCharges: {
//       $size: {
//         $filter: {
//           input: '$masterData.indexChargesData',
//           as: 'charge',
//           cond: { $eq: ['$$charge.chargeStatus', 'Closed'] },
//         },
//       },
//     },

//     // Calculate Total Charge Holders
//     totalChargeHolders: {
//       $size: { $ifNull: [{ $setUnion: ['$masterData.indexChargesData.chargeHolderName'] }, []] },
//     },

//     // Calculate Satisfied Charge Holders
//     satisfiedChargeHolders: {
//       $size: {
//         $ifNull: [
//           {
//             $setUnion: [
//               {
//                 $map: {
//                   input: {
//                     $filter: {
//                       input: '$masterData.indexChargesData',
//                       as: 'charge',
//                       cond: { $eq: ['$$charge.chargeStatus', 'Closed'] },
//                     },
//                   },
//                   as: 'closedCharge',
//                   in: '$$closedCharge.chargeHolderName',
//                 },
//               },
//             ],
//           },
//           [],
//         ],
//       },
//     },

//     // Calculate Open Charge Holders
//     openChargeHolders: {
//       $size: {
//         $ifNull: [
//           {
//             $setUnion: [
//               {
//                 $map: {
//                   input: {
//                     $filter: {
//                       input: '$masterData.indexChargesData',
//                       as: 'charge',
//                       cond: { $eq: ['$$charge.chargeStatus', 'Open'] },
//                     },
//                   },
//                   as: 'openCharge',
//                   in: '$$openCharge.chargeHolderName',
//                 },
//               },
//             ],
//           },
//           [],
//         ],
//       },
//     },

//     // Calculate Total Open Charge Amount
//     totalOpenChargeAmount: {
//       $sum: {
//         $map: {
//           input: {
//             $filter: {
//               input: '$masterData.indexChargesData',
//               as: 'charge',
//               cond: { $eq: ['$$charge.chargeStatus', 'Open'] },
//             },
//           },
//           as: 'openCharge',
//           in: { $toDouble: '$$openCharge.amount' },
//         },
//       },
//     },

//     // Calculate Total Satisfied Charge Amount
//     totalSatisfiedChargeAmount: {
//       $sum: {
//         $map: {
//           input: {
//             $filter: {
//               input: '$masterData.indexChargesData',
//               as: 'charge',
//               cond: { $eq: ['$$charge.chargeStatus', 'Closed'] },
//             },
//           },
//           as: 'closedCharge',
//           in: { $toDouble: '$$closedCharge.amount' },
//         },
//       },
//     },

//     // Array of charges with specific fields
//     chargesDetails: {
//       $map: {
//         input: '$masterData.indexChargesData',
//         as: 'charge',
//         in: {
//           chargeHolderName: {
//             $cond: [{ $eq: ['$$charge.chargeHolderName', ''] }, '-', '$$charge.chargeHolderName'],
//           },
//           status: {
//             $cond: [{ $eq: ['$$charge.chargeStatus', ''] }, '-', '$$charge.chargeStatus'],
//           },
//           createdOn: {
//             $cond: [{ $eq: ['$$charge.dateOfCreation', ''] }, '-', '$$charge.dateOfCreation'],
//           },
//           modifiedOn: {
//             $cond: [
//               { $eq: ['$$charge.dateOfModification', ''] },
//               '-',
//               '$$charge.dateOfModification',
//             ],
//           },
//           closedOn: {
//             $cond: [
//               { $eq: ['$$charge.dateOfSatisfaction', ''] },
//               '-',
//               '$$charge.dateOfSatisfaction',
//             ],
//           },
//           amount: { $toDouble: '$$charge.amount' },
//         },
//       },
//     },
//   },
// };
