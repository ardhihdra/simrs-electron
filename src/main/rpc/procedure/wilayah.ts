import z from "zod";
import { t } from "..";
import { ApiResponseSchema } from "simrs-types";

export const wilayahRpc = {
 getProvince: t.input(z.any()).output(ApiResponseSchema(z.any()).optional()).query(async ({client}) => {
    const data = await client.get('/api/wilayah/listAll?parentCode=null')
    console.log(data)
    const res = await data.json()
    console.log("RES", res)
    return res
 }),
 getWilayahFromParentCode: t.input(z.object({parentCode: z.string()})).output(ApiResponseSchema(z.any()).optional()).query(async ({client},input) => {
    const data = await client.get(`/api/wilayah/listAll?filter=parentCode&equal=${input.parentCode}`)
    const res = await data.json()
    return res
 }),  
}