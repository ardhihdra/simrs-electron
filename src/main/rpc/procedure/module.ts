import z from "zod";
import { t } from "..";

const MySchema = z.object({
    success:z.boolean().optional(),
    result:z.array(z.object({
        configs:z.array(z.object({
            allowedModules:z.array(z.string()),
            id:z.number(),
            label:z.string()
        })).optional()
    })).optional()
})

export const mmoduleRpc = {
    my: t.input(z.any()).output(MySchema).query(async ({ client }) => {
        const data = await client.get('/api/module/my')
        const result = await data.json()
        console.log("MYGET:",result)
        return result
    }),
    myById: t.input(z.object({id:z.string()})).output(z.any()).query(async ({ client }, input) => {
        const data = await client.get(`/api/module/my/${input.id}`)
        const result = await data.json()
        console.log("MYPOST:",result)
        return result
    }),
    scope: t.input(z.any()).output(z.any()).mutation(async({client},input)=>{
        const data = await client.post('/api/module/scope',input)
        const result = await data.json()
        console.log("SCOPE:",result)
        return result
    })
}