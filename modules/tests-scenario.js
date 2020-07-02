//Setup Module        ===> keep it ? What is the mapping of the plugin and reports documment?
//Generate Module     ===> Do we save the generated csv in the index? ==> Scheduling Mode use existing scheduling function
//ReportList Module   ===> List of generated reports on the index.
//Download Module     ===> Download the csv in the frontend.

//Security wise do we keep the capability of the backend role?

//Unit Tests better when the code is switched to  typescript.

// Setup Module

//  case 1
//  index is not created
//  expected output = create index and return true

//  case 2
//  index is  created
//  expected output = return true

//  case 3
//  user has no write rights on index
//  expected output = Authorization Exception

//  Saved Search Module
//  create n saved search
//  expected output = return n saved search of type search

//  Download module
//  input = csvReportId
//  expected output = return corresponding csv and dowloads it.

//  Reports List module
//  generate n reports

//  case 1
//  if n < 10 (default number of reports by user defined in the constants file.)
//  expected output = return n reports

//  case 2
//  if n > 10 (default number of reports by user defined in the constants file.)
//  expected output = return 10 reports

//BackEnd Role Module
//  Add the required backend role in kibana.yml

//  case 1 User group doesn't include the required backend
//  expected output = Authorization error

//  case 2  User group includes the required backend
//  expected output = ok

//  Now remove the required backend role from kibana.yml

//  case 3  User group doesn't include the required backend
//  expected output = ok

//  case 4  User group includes the required backend
//  expected output = ok
