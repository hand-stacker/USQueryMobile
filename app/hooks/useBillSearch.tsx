import useGetBillsByKeyword from "./useGetBillsByKeyword";
import useGetRecentBills from "./useGetRecentBills";

interface props{
    vars: any;
    searchType: 'subject' | 'keyword';
}

// helper hook to determine which search hook to use based on the search type
export function useBillSearch({ vars, searchType }: props) {
    const subjectArgs = [vars.after, vars.bill_type, vars.first, vars.congress_num, vars.subject_list, vars.truncate, vars.sort];
    const keywordArgs = [vars.after, vars.bill_type, vars.first, vars.congress_num, vars.keyword, vars.sort];
    const subject = useGetRecentBills(...subjectArgs, { skip: searchType !== 'subject' });
    const keyword = useGetBillsByKeyword(...keywordArgs, { skip: searchType !== 'keyword' });
  return searchType === 'keyword' ? keyword : subject;
}