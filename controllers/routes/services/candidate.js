const { ObjectId } = require("mongodb");
const mongoose = require('mongoose');


module.exports = {
  adminCandidatesList: (sort, perPage, page, event, sortingOrder, filter) => {
    let { value, order } = sortingOrder
    let agg = [];
    agg.push({ $match: filter });
    let sorting = [
      { $sort: sort },
      { $skip: perPage * page - perPage },
      { $limit: perPage },
    ];
    let candidatecashbacksLookup = {
      $lookup: {
        from: "candidatecashbacks",
        localField: "_id",
        foreignField: "candidateId",
        as: "cashback",
      },
    };
    let cashbackDueField = {
      $addFields: {
        cashbackDue: {
          $sum: "$cashback.amount",
        },
      },
    };
    let cashbackDebitedFilter = {
      $addFields: {
        paid: {
          $filter: {
            input: "$cashback",
            as: "cashback",
            cond: {
              $eq: [
                "$$cashback.eventName",
                event,
              ],
            },
          },
        },
      },
    };
    let cashbackDebitedField = {
      $addFields: {
        cashbackDebited: {
          $sum: "$paid.amount",
        },
      },
    };
    let cashbackDebitedPositiveField = {
      $addFields: {
        cashbackPaid: {
          $multiply: ["$cashbackDebited", -1],
        },
      },
    };
    let paymentdetailsLookup = {
      $lookup: {
        from: "paymentdetails",
        localField: "_id",
        foreignField: "_candidate",
        as: "paymentDetails",
      },
    };
    let paymentDetailsFilter = {
      $addFields: {
        payment: {
          $filter: {
            input: "$paymentDetails",
            as: "paymentDetails",
            cond: {
              $eq: ["$$paymentDetails.paymentStatus", "captured"],
            },
          },
        },
      },
    };
    let amountSpentField = {
      $addFields: {
        amountSpent: {
          $sum: "$payment.amount",
        },
      },
    };
    let referralsLookup = {
      $lookup: {
        from: "referrals",
        localField: "_id",
        foreignField: "referredBy",
        as: "refs",
      },
    };
    let refCountField = {
      $addFields: {
        refCount: { $size: "$refs" },
      },
    };
    if (value == "cashbackDue" && order) {
      agg.push(candidatecashbacksLookup);
      agg.push(cashbackDueField);
      agg.push(...sorting);
      agg.push(cashbackDebitedFilter);
      agg.push(cashbackDebitedField);
      agg.push(cashbackDebitedPositiveField);
      agg.push(paymentdetailsLookup);
      agg.push(paymentDetailsFilter);
      agg.push(amountSpentField);
      agg.push(referralsLookup);
      agg.push(refCountField);
    } else if (value == "cashbackPaid" && order) {
      agg.push(candidatecashbacksLookup);
      agg.push(cashbackDebitedFilter);
      agg.push(cashbackDebitedField);
      agg.push(cashbackDebitedPositiveField);
      agg.push(...sorting);
      agg.push(cashbackDueField);
      agg.push(paymentdetailsLookup);
      agg.push(paymentDetailsFilter);
      agg.push(amountSpentField);
      agg.push(referralsLookup);
      agg.push(refCountField);
    } else if (value == "amountSpent" && order) {
      agg.push(paymentdetailsLookup);
      agg.push(paymentDetailsFilter);
      agg.push(amountSpentField);
      agg.push(...sorting);
      agg.push(candidatecashbacksLookup);
      agg.push(cashbackDebitedFilter);
      agg.push(cashbackDebitedField);
      agg.push(cashbackDebitedPositiveField);
      agg.push(cashbackDueField);
      agg.push(referralsLookup);
      agg.push(refCountField);
    } else if (value == "refCount" && order) {
      agg.push(referralsLookup);
      agg.push(refCountField);
      agg.push(...sorting);
      agg.push(paymentdetailsLookup);
      agg.push(paymentDetailsFilter);
      agg.push(amountSpentField);
      agg.push(candidatecashbacksLookup);
      agg.push(cashbackDebitedFilter);
      agg.push(cashbackDebitedField);
      agg.push(cashbackDebitedPositiveField);
      agg.push(cashbackDueField);
    } else {
      agg.push(...sorting);
      agg.push(referralsLookup);
      agg.push(refCountField);
      agg.push(paymentdetailsLookup);
      agg.push(paymentDetailsFilter);
      agg.push(amountSpentField);
      agg.push(candidatecashbacksLookup);
      agg.push(cashbackDebitedFilter);
      agg.push(cashbackDebitedField);
      agg.push(cashbackDebitedPositiveField);
      agg.push(cashbackDueField);
    }
    agg.push({
      $project: {
        createdAt: 1,
        _id: 1,
        name: 1,
        mobile: 1,
        refCount: 1,
        cashbackDue: 1,
        cashbackPaid: 1,
        amountSpent: 1,
        status: 1,
        visibility: 1,
        verified: 1
      },
    });
    return agg;
  },
  companyCandidateList: (sorting, perPage, page, filter, coordinates, companyId) => {
    let agg = [
      {
        $geoNear: {
          near: { type: "Point", coordinates: [...coordinates] },
          distanceField: "distance",
          maxDistance: Infinity,
          query: { ...filter },
        },
      },
    ];
    if (sorting.length) {
      agg.push(
        {
          $lookup: {
            from: "appliedjobs",
            let: { id: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$_candidate", "$$id"] },
                      { $eq: ["$_company", new mongoose.Types.ObjectId(companyId)] },
                    ],
                  },
                },
              },
            ],
            as: "appliedJobs",
          },
        },
        ...sorting,
        { $skip: perPage * page - perPage },
        { $limit: perPage }
      );
    } else {
      agg.push(
        { $skip: perPage * page - perPage },
        { $limit: perPage },
        {
          $lookup: {
            from: "appliedjobs",
            let: { id: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$_candidate", "$$id"] },
                      { $eq: ["$_company", mongoose.Types.ObjectId(companyId)] },
                    ],
                  },
                },
              },
            ],
            as: "appliedJobs",
          },
        }
      );
    }

    agg.push(
      {
        $lookup: {
          from: "subqualifications",
          localField: "qualifications.subQualification",
          foreignField: "_id",
          as: "subQualifications",
        },
      },
      {
        $project: {
          name: 1,
          sex: 1,
          highestQualification: 1,
          appliedJobs: 1,
          distance: 1,
          subQualifications: 1,
          totalExperience: 1,
        },
      }
    );
    return agg;
  },


  // candidateCourseList: (sort, perPage, page, filter) => {
  //   let sorting = [
  //     { $sort: sort },
  //     { $skip: perPage * page - perPage },
  //     { $limit: perPage },
  //   ];
  //   const agg = [{
  //     $lookup: {
  //       from: "candidates",
  //       let: { id: "$_candidate" },
  //       pipeline: [{
  //         $match: {
  //           $expr: {
  //             $and: [
  //               { $eq: ["$_id", "$$id"] },
  //               filter
  //             ],
  //           },
  //         },
  //       }],
  //       as: "_candidate",
  //     },
  //   }, {
  //     $unwind: "$_candidate"
  //   }, {
  //     $lookup: {
  //       from: "courses",
  //       let: { id: "$_course" },
  //       pipeline: [
  //         {
  //           $match: {
  //             $expr:
  //               { $eq: ["$_id", "$$id"] }
  //           },
  //         },
  //         {
  //           $lookup: {
  //             from: "coursesectors",
  //             "let": {
  //               "sectorId": "$sectors"
  //             },
  //             "pipeline": [
  //               {
  //                 "$match": {
  //                   "$expr": {
  //                     "$in": [
  //                       "$_id",
  //                       "$$sectorId",
  //                     ]
  //                   }
  //                 }
  //               },
  //             ],
  //             as: "sectors",
  //           }
  //         },
  //         {
  //           $unwind: "$sectors"
  //         }
  //       ],
  //       as: "_course",
  //     },
  //   },
  //   {
  //     $unwind: "$_course"
  //   },
  //   ...sorting,
  //   {
  //     "$addFields": {
  //       "name": { "$cond": { "if": { "$ne": ["$_candidate", null] }, "then": "$_candidate.name", "else": "" } },
  //       "mobile": { "$cond": { "if": { "$ne": ["$_candidate", null] }, "then": "$_candidate.mobile", "else": "" } },
  //       "courseName": { "$cond": { "if": { "$ne": ["$_course", null] }, "then": "$_course.name", "else": "" } },
  //       "registrationCharges": { "$cond": { "if": { "$ne": ["$_course", null] }, "then": "$_course.registrationCharges", "else": 0 } },
  //       "registrationFee":{ "$ifNull": ["$registrationFee", 'Unpaid'] },
  //       "sector": { "$cond": { "if": { "$ne": ["$_course", null] }, "then": "$_course.sectors.name", "else": "" } },
  //     }
  //   },
  //   {
  //     "$project": {
  //       "createdAt": 1,
  //       "_id": 1,
  //       "name": 1,
  //       "mobile": 1,
  //       "courseName": 1,
  //       "registrationCharges": 1,
  //       "registrationFee": 1,
  //       "sector": 1,
  //       "courseStatus": 1,
  //       "remarks": 1,
  //       "assignDate": 1,
  //       "url" : 1
  //     }
  //   }
  //   ];
  //   return agg;
  // },


  candidateCourseList: (sort, perPage, page, filter) => {
    const offset = (page - 1) * perPage;
  
    const agg = [
      {
        $lookup: {
          from: "candidateprofiles",
          let: { id: "$_candidate" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$id"] },
                ...filter // Apply any external filters
              },
            },
            {
              $project: { name: 1, mobile: 1, email:1 } // Only necessary fields
            }
          ],
          as: "_candidate",
        },
      },
      {
        $unwind: {
          path: "$_candidate",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: "courses",
          let: { id: "$_course" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$id"] }
              },
            },
            {
              $lookup: {
                from: "coursesectors",
                let: { sectorId: "$sectors" },
                pipeline: [
                  {
                    $match: {
                      $expr: { $in: ["$_id", "$$sectorId"] },
                    },
                  },
                  {
                    $project: { name: 1 }
                  },
                ],
                as: "sectors",
              },
            },
          ],
          as: "_course",
        },
      },
      {
        $unwind: {
          path: "$_course",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $sort: sort,
      },
      {
        $skip: offset,
      },
      {
        $limit: perPage,
      },
      {
        $lookup: {
          from: "users", // or the actual collection name where registeredBy is stored
          localField: "registeredBy",
          foreignField: "_id",
          as: "registeredUser"
        }
      },
      {
        $unwind: {
          path: "$registeredUser",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: "centers",
          localField: "_center",
          foreignField: "_id",
          as: "centerInfo"
        }
      },
      {
        $unwind: {
          path: "$centerInfo",
          preserveNullAndEmptyArrays: true
        }
      },
      
      {
        $addFields: {
          name: { $ifNull: ["$_candidate.name", ""] },
          candidateId: { $ifNull: ["$_candidate._id", ""] },
          mobile: { $ifNull: ["$_candidate.mobile", ""] },
          email: { $ifNull: ["$_candidate.email", ""] },
          courseName: { $ifNull: ["$_course.name", ""] },
          courseId: { $ifNull: ["$_course._id", ""] },
          registrationCharges: { $ifNull: ["$_course.registrationCharges", 0] },
          registrationFee: { $ifNull: ["$registrationFee", "Unpaid"] },
          sector: { $ifNull: ["$_course.sectors.name", []] },
          docsRequired: { $ifNull: ["$_course.docsRequired", []] },
          uploadedDocs: { $ifNull: ["$uploadedDocs", []] },  // ✅ Ye important
          registeredByName: { $ifNull: ["$registeredUser.name", ""] }, // 👈 add this line
          centerId: { $ifNull: ["$centerInfo._id", ""] },
  centerName: { $ifNull: ["$centerInfo.name", ""] }
        },
      },
      {
        $project: {
          createdAt: 1,
          _id: 1,
          name: 1,
          mobile: 1,
          email:1,
          courseName: 1,
          registrationCharges: 1,
          registrationFee: 1,
          candidateId: 1,
          sector: 1,
          courseStatus: 1,
          courseId: 1,
          remarks: 1,
          assignDate: 1,
          url: 1,
          docsRequired: 1,
          uploadedDocs: 1, // ✅
          registeredBy: 1,
          registeredByName:1,
          centerId: 1,
          centerName:1
        },
      },
    ];
  
    return agg;
  }
  

  
  
};
